from django.db.models import Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Suspect, Interrogation, InterrogationFeedback, BoardConnection, Board, Verdict, Warrant
from .serializers import (
    SuspectSerializer, InterrogationSerializer, 
    InterrogationFeedbackSerializer, BoardConnectionSerializer, BoardSerializer,
    VerdictSerializer, WarrantSerializer
)
from .permissions import IsCaptain, IsDetective, IsJudge, IsSergeant
from cases.permissions import IsOfficerOrHigher
def _reward_amount_for_suspect(suspect):
    if not suspect:
        return 0

    nc = (getattr(suspect, 'national_code', '') or '').strip()
    if not nc:
        # fallback قدیمی
        if not suspect.case_id:
            return 0
        days = _pursuit_days(suspect)
        level = _crime_level_score(suspect.case.crime_level)
        return days * level * 20000000

    # حالت صحیح طبق PDF: max(Lj) از پرونده‌های باز، max(Di) از همه پرونده‌ها
    qs = Suspect.objects.select_related('case').filter(national_code=nc)

    max_lj = 0
    max_di = 0

    for s in qs:
        if s.case_id:
            di = _crime_level_score(s.case.crime_level)
            if di > max_di:
                max_di = di

        if s.case_id and _is_case_open(s.case):
            lj = _pursuit_days(s)
            if lj > max_lj:
                max_lj = lj

    score = max_lj * max_di
    return score * 20000000

class CriminalRankingView(APIView):
    permission_classes = [IsOfficerOrHigher]

    def get(self, request):
        """Checkpoint 1: Ranking based on Guilty Verdicts"""
        # Group by national_code and count guilty results
        rankings = Verdict.objects.filter(result='GUILTY').values(
            'suspect__national_code', 'suspect__first_name', 'suspect__last_name'
        ).annotate(
            guilty_count=Count('id')
        ).order_by('-guilty_count')

        results = []
        for r in rankings:
            results.append({
                "کدملی": r['suspect__national_code'],
                "نام": f"{r['suspect__first_name']} {r['suspect__last_name']}",
                "امتیاز_جرم": r['guilty_count']
            })
            
        return Response(results)

def _match_suspect(report):
    if report.suspect_id:
        return report.suspect
    if report.suspect_national_code:
        match = Suspect.objects.filter(national_code=report.suspect_national_code).order_by('-created_at').first()
        if match:
            report.suspect = match
            report.save(update_fields=['suspect'])
            return match
    return None

class WarrantViewSet(viewsets.ModelViewSet):
    queryset = Warrant.objects.all()
    serializer_class = WarrantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            qs = qs.filter(case_id=case_id)
        
        # Sergeants/Chiefs see everything, others see only their requests
        user = self.request.user
        roles = [r.code for r in user.roles.all()]
        if 'sergeant' in roles or 'captain' in roles or 'police_chief' in roles:
            return qs
        return qs.filter(requester=user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSergeant])
    def approve(self, request, pk=None):
        warrant = self.get_object()
        warrant.status = 'APPROVED'
        warrant.approver = request.user
        warrant.approver_notes = request.data.get('notes', '')
        warrant.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSergeant])
    def reject(self, request, pk=None):
        warrant = self.get_object()
        warrant.status = 'REJECTED'
        warrant.approver = request.user
        warrant.approver_notes = request.data.get('notes', '')
        warrant.save()
        return Response({'status': 'rejected'})

class BoardViewSet(viewsets.ModelViewSet):

    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated, IsDetective]

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset

class SuspectViewSet(viewsets.ModelViewSet):
    queryset = Suspect.objects.all()
    serializer_class = SuspectSerializer
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrHigher]


    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def status(self, request):
        suspects = Suspect.objects.select_related('case').all().order_by('id')
        serializer = SuspectStatusSerializer(suspects, many=True)
        return Response(serializer.data)

    from collections import defaultdict

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def most_wanted(self, request):
        suspects = Suspect.objects.select_related('case').all()

        # گروه‌بندی بر اساس national_code (اگر خالی بود، با id جدا نگهش می‌داریم)
        groups = {}
        for s in suspects:
            key = (s.national_code or "").strip()
            if not key:
                key = f"__suspect_{s.id}"  # برای افرادی که کدملی ندارند
            g = groups.get(key)
            if not g:
                full_name = f"{s.first_name} {s.last_name}".strip() or (s.name or "").strip()
                groups[key] = g = {
                    "national_code": s.national_code,
                    "full_name": full_name,
                    "suspect_ids": [],
                    "case_ids": set(),
                    "max_pursuit_days_open": 0,
                    "max_crime_level": 0,  # امتیاز ۱..۴
                }

            g["suspect_ids"].append(s.id)
            if s.case_id:
                g["case_ids"].add(s.case_id)

            # max(Di) از همه پرونده‌ها
            if s.case_id:
                di = _crime_level_score(s.case.crime_level)
                if di > g["max_crime_level"]:
                    g["max_crime_level"] = di

            # max(Lj) فقط از پرونده‌های باز
            if s.case_id and _is_case_open(s.case):
                lj = _pursuit_days(s)  # این تابع خودش open بودن را هم چک می‌کند
                if lj > g["max_pursuit_days_open"]:
                    g["max_pursuit_days_open"] = lj

        # تبدیل به لیست + فیلتر یک ماه
        results = []
        for key, g in groups.items():
            if g["max_pursuit_days_open"] <= 30:
                continue

            score = g["max_pursuit_days_open"] * g["max_crime_level"]
            reward_amount = score * 20000000

            results.append({
                "national_code": g["national_code"],
                "full_name": g["full_name"],
                "suspect_ids": g["suspect_ids"],
                "case_ids": sorted(list(g["case_ids"])),
                "max_pursuit_days": g["max_pursuit_days_open"],
                "max_crime_level": g["max_crime_level"],
                "score": score,
                "reward_amount": reward_amount,
            })

        # مرتب‌سازی نزولی بر اساس score
        results.sort(key=lambda x: x["score"], reverse=True)
        return Response(results)

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            print("DEBUG: Suspect create data:", request.data)
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({
                'error': str(e),
                'detail': 'Internal Server Error during suspect creation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsDetective])
    def toggle_board(self, request, pk=None):
        suspect = self.get_object()
        suspect.is_on_board = not suspect.is_on_board
        suspect.save()
        return Response({'is_on_board': suspect.is_on_board})

class InterrogationViewSet(viewsets.ModelViewSet):
    queryset = Interrogation.objects.all()
    serializer_class = InterrogationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrHigher]

    def perform_create(self, serializer):
        serializer.save(interrogator=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsCaptain])
    def feedback(self, request, pk=None):
        interrogation = self.get_object()
        serializer = InterrogationFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(interrogation=interrogation, captain=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class BoardConnectionViewSet(viewsets.ModelViewSet):
    queryset = BoardConnection.objects.all()
    serializer_class = BoardConnectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsDetective]

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            print("DEBUG: BoardConnection create data:", request.data)
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({
                'error': str(e),
                'detail': 'Internal Server Error during connection creation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerdictViewSet(viewsets.ModelViewSet):
    queryset = Verdict.objects.all()
    serializer_class = VerdictSerializer
    permission_classes = [permissions.IsAuthenticated, IsJudge]

    def perform_create(self, serializer):
        serializer.save(judge=self.request.user)



    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset
