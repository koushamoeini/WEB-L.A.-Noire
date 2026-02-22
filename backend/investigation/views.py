from django.db import models
from django.db.models import Count, Q
import random
import string
from collections import defaultdict
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.shortcuts import render
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter
from cases.permissions import IsOfficerOrHigher  # از قبل داری

from cases.models import Case
from .models import Suspect, Interrogation, InterrogationFeedback, BoardConnection, Board, Verdict, Warrant, RewardReport
from .serializers import (
    SuspectSerializer, SuspectStatusSerializer, InterrogationSerializer, 
    InterrogationFeedbackSerializer, BoardConnectionSerializer, BoardSerializer,
    VerdictSerializer, WarrantSerializer, RewardReportSerializer
)
from .permissions import IsCaptain, IsDetective, IsJudge, IsSergeant, IsPoliceChief
from cases.permissions import IsOfficerOrHigher, IsInvestigator



OPEN_CASE_STATUSES = {
    Case.Status.PENDING_TRAINEE,
    Case.Status.PENDING_OFFICER,
    Case.Status.ACTIVE,
    Case.Status.IN_PURSUIT,
    Case.Status.PENDING_SERGEANT,
    Case.Status.PENDING_CHIEF,
}


def _is_case_open(case):
    if not case:
        return False
    return case.status in OPEN_CASE_STATUSES


def _pursuit_days(suspect):
    # اگر دستگیر شده باشد، روزهای تعقیب (و مژدگانی) متوقف می‌شود
    if not suspect or not suspect.case_id or not _is_case_open(suspect.case):
        return 0
    if suspect.is_arrested or suspect.status == Suspect.Status.ARRESTED:
        return 0
    if not suspect.created_at:
        return 0
    return max((timezone.now() - suspect.created_at).days, 0)


def _crime_level_score(level):
    if level == Case.CrimeLevel.LEVEL_3:
        return 1
    if level == Case.CrimeLevel.LEVEL_2:
        return 2
    if level == Case.CrimeLevel.LEVEL_1:
        return 3
    if level == Case.CrimeLevel.CRITICAL:
        return 4
    return 0


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


def _generate_tracking_code():
    while True:
        code = ''.join(random.choices(string.digits, k=10))
        if not RewardReport.objects.filter(tracking_code=code).exists():
            return code


def _generate_reward_code():
    """کد یکتای ۶ رقمی برای سیستم پاداش"""
    while True:
        code = ''.join(random.choices(string.digits, k=6))
        if not RewardReport.objects.filter(reward_code=code).exists():
            return code


def _parse_approved(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return bool(value)
    return str(value).strip().lower() in {'true', '1', 'yes', 'y', 'on'}


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
        
        # When a warrant is approved, the suspect enters the 'UNDER_ARREST' (in pursuit) state
        if warrant.suspect:
            warrant.suspect.status = Suspect.Status.UNDER_ARREST
            warrant.suspect.is_arrested = True # Keep legacy field sync for now
            warrant.suspect.save()
            
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




    @extend_schema(summary="لیست وضعیت مظنونین", responses={200: SuspectStatusSerializer(many=True)})
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def status_list(self, request):
        suspects = Suspect.objects.select_related('case').all().order_by('id')
        serializer = SuspectStatusSerializer(suspects, many=True)
        return Response(serializer.data)

    @extend_schema(summary="لیست خطرناک‌ترین مجرمان")
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
                    "image": s.image.url if s.image else None,
                    "max_pursuit_days_open": 0,
                    "max_crime_level": 0,  # امتیاز ۱..۴
                }

            g["suspect_ids"].append(s.id)
            if s.case_id:
                g["case_ids"].add(s.case_id)
            
            # ثبت تصویر از مظنونینی که عکس دارند
            if s.image and not g["image"]:
                g["image"] = s.image.url

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
                "image": g["image"],
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSergeant | IsPoliceChief])
    def mark_as_arrested(self, request, pk=None):
        suspect = self.get_object()
        # Suspect can only be marked as ARRESTED if they are currently UNDER_ARREST (warrant approved)
        if suspect.status != Suspect.Status.UNDER_ARREST:
            return Response(
                {'error': 'Suspect must be under arrest (warrant approved) before being marked as arrested.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        suspect.status = Suspect.Status.ARRESTED
        suspect.is_arrested = True
        suspect.save()
        return Response({'status': 'arrested', 'message': f'Suspect {suspect.name} marked as officially arrested.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsDetective])
    def toggle_board(self, request, pk=None):
        suspect = self.get_object()
        suspect.is_on_board = not suspect.is_on_board
        suspect.save()
        return Response({'is_on_board': suspect.is_on_board})

class InterrogationViewSet(viewsets.ModelViewSet):
    queryset = Interrogation.objects.all().order_by('-created_at')
    serializer_class = InterrogationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrHigher]

    def get_permissions(self):
        """
        Allow Detectives and Sergeants to perform CRUD.
        Captain/Chief have additional permissions via @action decorators.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # We can be more specific: only allowed roles or owners
            return [permissions.IsAuthenticated(), IsInvestigator()]
        return super().get_permissions()

    def perform_create(self, serializer):
        suspect = serializer.validated_data.get('suspect')
        if suspect and suspect.status != Suspect.Status.ARRESTED:
            raise PermissionDenied("تا زمانی که متهم رسماً دستگیر نشده است، امکان ثبت بازجویی وجود ندارد.")

        user = self.request.user
        roles = [r.code for r in user.roles.all()]
        
        # If user is detective, they fill the interrogator slot
        if 'detective' in roles:
            serializer.save(interrogator=user)
        # If user is sergeant, they fill the supervisor slot
        elif 'sergeant' in roles:
            serializer.save(supervisor=user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        roles = [r.code for r in user.roles.all()]
        instance = self.get_object()

        if 'detective' in roles:
            # Detectives update their own score and potentially empty interrogator field
            save_kwargs = {}
            if not instance.interrogator:
                save_kwargs['interrogator'] = user
            serializer.save(**save_kwargs)
        elif 'sergeant' in roles or 'captain' in roles or 'police_chief' in roles:
            # Supervisors update their score and supervisor field
            save_kwargs = {}
            if not instance.supervisor:
                save_kwargs['supervisor'] = user
            serializer.save(**save_kwargs)
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsCaptain])
    def feedback(self, request, pk=None):
        interrogation = self.get_object()
        
        # Check if already has feedback
        feedback_obj = getattr(interrogation, 'feedback', None)
        if feedback_obj:
            serializer = InterrogationFeedbackSerializer(feedback_obj, data=request.data, partial=True)
        else:
            serializer = InterrogationFeedbackSerializer(data=request.data)
            
        serializer.is_valid(raise_exception=True)
        serializer.save(interrogation=interrogation, captain=request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsPoliceChief])
    def chief_confirm(self, request, pk=None):
        interrogation = self.get_object()
        if not hasattr(interrogation, 'feedback'):
            return Response({'error': 'ابتدا کاپیتان باید نظر خود را ثبت کند.'}, status=400)
            
        feedback = interrogation.feedback
        feedback.is_chief_confirmed = request.data.get('is_confirmed', True)
        feedback.chief_notes = request.data.get('notes', '')
        feedback.chief = request.user
        feedback.save()
        return Response({'status': 'confirmed by chief'})

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

    def create(self, request, *args, **kwargs):
        case_id = request.data.get('case')
        suspect_id = request.data.get('suspect')
        if Verdict.objects.filter(case_id=case_id, suspect_id=suspect_id).exists():
            return Response({'error': 'برای این متهم قبلاً حکم صادر شده است'}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(judge=self.request.user)

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset


class GlobalStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="آمار جامع پروژه",
        description="تجمیع آمارهای مربوط به پرونده‌ها، مظنونین و مبالغ پاداش پرداخت شده.",
        responses={200: dict}
    )
    def get(self, request):
        case_stats = Case.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(status=Case.Status.ACTIVE)),
            solved=Count('id', filter=Q(status=Case.Status.SOLVED)),
        )
        reward_stats = RewardReport.objects.aggregate(
            total_count=Count('id'),
            total_paid=Count('id', filter=Q(is_paid=True)),
            sum_paid=models.Sum('reward_amount', filter=Q(is_paid=True))
        )
        suspect_stats = Suspect.objects.aggregate(
            total=Count('id'),
            under_pursuit=Count('id', filter=Q(case__status__in=OPEN_CASE_STATUSES))
        )

        return Response({
            "cases": case_stats,
            "rewards": {
                "count": reward_stats['total_count'],
                "paid_count": reward_stats['total_paid'],
                "total_amount_paid": reward_stats['sum_paid'] or 0
            },
            "suspects": suspect_stats,
            "server_time": timezone.now()
        })


class RewardReportViewSet(viewsets.ModelViewSet):
    queryset = RewardReport.objects.all().order_by('-created_at')
    serializer_class = RewardReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        # New: Filter by suspect national code
        suspect_nc = self.request.query_params.get('suspect_national_code')
        if suspect_nc:
            qs = qs.filter(suspect_national_code=suspect_nc)

        user = self.request.user
        if user.is_anonymous:
            return qs.none()
            
        roles = [r.code for r in user.roles.all()]
        elevated = user.is_superuser or any(r in roles for r in ['police_officer', 'captain', 'police_chief', 'detective', 'sergeant'])
        if elevated:
            return qs
        return qs.filter(reporter=user)

    @extend_schema(summary="ثبت گزارش جدید پاداش")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @extend_schema(summary="بررسی اولیه توسط افسر")
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOfficerOrHigher])
    def officer_review(self, request, pk=None):
        report = self.get_object()
        if report.status != RewardReport.Status.PENDING_OFFICER:
            return Response({'error': 'This report is not awaiting officer review.'}, status=status.HTTP_400_BAD_REQUEST)

        approved = _parse_approved(request.data.get('approved'))
        report.officer = request.user
        report.officer_notes = request.data.get('notes', '')

        suspect_id = request.data.get('suspect')
        if suspect_id:
            report.suspect_id = suspect_id

        if approved:
            report.status = RewardReport.Status.PENDING_DETECTIVE
        else:
            report.status = RewardReport.Status.REJECTED

        report.save()
        return Response({'status': report.status})

    @extend_schema(summary="بررسی نهایی توسط کارآگاه و محاسبه پاداش")
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsDetective])
    def detective_review(self, request, pk=None):
        report = self.get_object()
        if report.status != RewardReport.Status.PENDING_DETECTIVE:
            return Response({'error': 'This report is not awaiting detective review.'}, status=status.HTTP_400_BAD_REQUEST)

        approved = _parse_approved(request.data.get('approved'))
        report.detective = request.user
        report.detective_notes = request.data.get('notes', '')

        suspect_id = request.data.get('suspect')
        if suspect_id:
            report.suspect_id = suspect_id

        if approved:
            suspect = _match_suspect(report)
            if not suspect:
                return Response({'error': 'Suspect not found for reward calculation.'}, status=status.HTTP_400_BAD_REQUEST)
            report.reward_amount = _reward_amount_for_suspect(suspect)
            report.tracking_code = _generate_tracking_code()
            report.reward_code = _generate_reward_code()
            report.status = RewardReport.Status.APPROVED
        else:
            report.status = RewardReport.Status.REJECTED

        report.save()
        return Response({
            'status': report.status, 
            'reward_amount': report.reward_amount, 
            'tracking_code': report.tracking_code,
            'reward_code': report.reward_code
        })

    @extend_schema(summary="استعلام پاداش کد ملی + کد پاداش")
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_payout(self, request):
        # بررسی اینکه کاربر حتماً یکی از رده‌های پلیسی/قضایی باشد
        user_roles = [r.code for r in request.user.roles.all()]
        police_roles = ['trainee', 'police_officer', 'sergeant', 'detective', 'captain', 'police_chief', 'forensic_doctor', 'judge', 'qazi']
        if not any(r in police_roles for r in user_roles) and not request.user.is_superuser:
            return Response({'error': 'فقط کادر پلیس مجاز به استعلام هستند.'}, status=403)
            
        national_code = request.data.get('national_code', '').strip()
        reward_code = request.data.get('reward_code', '').strip()

        if not national_code or not reward_code:
            return Response({'error': 'لطفاً کد ملی و کد پاداش را وارد کنید.'}, status=400)

        report = RewardReport.objects.filter(
            reporter__profile__national_code=national_code,
            reward_code=reward_code,
            status=RewardReport.Status.APPROVED
        ).first()

        if not report:
            return Response({'error': 'گزارشی با این مشخصات یافت نشد یا هنوز تایید نهایی نشده است.'}, status=404)

        return Response({
            'reporter_name': f"{report.reporter.first_name} {report.reporter.last_name}",
            'reporter_username': report.reporter.username,
            'reporter_national_code': national_code,
            'reporter_phone': getattr(report.reporter.profile, 'phone', 'نامشخص') if hasattr(report.reporter, 'profile') else 'نامشخص',
            'reward_amount': report.reward_amount,
            'is_paid': report.is_paid,
            'suspect_info': f"{report.suspect.first_name} {report.suspect.last_name}" if report.suspect else report.suspect_full_name,
            'report_date': report.created_at.strftime('%Y/%m/%d'),
            'description': report.description,
            'officer_notes': report.officer_notes,
            'detective_notes': report.detective_notes,
        })

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def request_payment(self, request, pk=None):
        """شبیه‌ساز هدایت به درگاه بانکی (بخش ۱ چکلست)"""
        report = self.get_object()
        if report.status != RewardReport.Status.APPROVED:
            return Response({'error': 'فقط گزارش‌های تایید شده قابل پرداخت هستند.'}, status=400)
        if report.is_paid:
            return Response({'error': 'این پاداش قبلاً پرداخت شده است.'}, status=400)
        
        context = {
            'report_id': report.id,
            'amount': report.reward_amount,
            'tracking_code': report.tracking_code,
        }
        return render(request, 'landing/payment_gateway.html', context)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def payment_callback(self, request, pk=None):
        """صفحه بازگشت از درگاه (بخش ۱ چکلست)"""
        report = self.get_object()
        status_code = request.data.get('status')

        if status_code == 'OK':
            report.is_paid = True
            report.paid_at = timezone.now()
            # در شبیه‌ساز، چون کاربر مستقیم از بانک میاد، پرداخت‌کننده رو سیستم در نظر می‌گیریم
            report.save(update_fields=['is_paid', 'paid_at'])
            msg = "پرداخت با موفقیت انجام شد. مبلغ به حساب شما واریز گردید."
            success = True
        else:
            msg = "پرداخت توسط کاربر لغو شد یا با خطا مواجه گردید."
            success = False

        return Response({
            "success": success,
            "message": msg,
            "tracking_code": report.tracking_code,
            "amount": report.reward_amount
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOfficerOrHigher])
    def mark_paid(self, request, pk=None):
        report = self.get_object()
        if report.status != RewardReport.Status.APPROVED:
            return Response({'error': 'Only approved reports can be paid.'}, status=status.HTTP_400_BAD_REQUEST)
        if report.is_paid:
            return Response({'error': 'This reward is already marked as paid.'}, status=status.HTTP_400_BAD_REQUEST)

        code = (request.data.get('tracking_code') or '').strip()
        if code and report.tracking_code and code != report.tracking_code:
            return Response({'error': 'Tracking code does not match.'}, status=status.HTTP_400_BAD_REQUEST)

        report.is_paid = True
        report.paid_at = timezone.now()
        report.paid_by = request.user
        report.save(update_fields=['is_paid', 'paid_at', 'paid_by'])
        return Response({'status': 'paid', 'paid_at': report.paid_at})


    @extend_schema(summary="پیگیری وضعیت پاداش با کد ملی و کد رهگیری")
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOfficerOrHigher])
    def lookup(self, request):
        national_code = (request.query_params.get('national_code') or '').strip()
        tracking_code = (request.query_params.get('tracking_code') or '').strip()

        if not national_code or not tracking_code:
            return Response(
                {'error': 'national_code and tracking_code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report = (
            RewardReport.objects
            .select_related('reporter', 'reporter__profile', 'suspect')
            .filter(status=RewardReport.Status.APPROVED, tracking_code=tracking_code)
            .first()
        )
        if not report:
            return Response({'error': 'No approved report found for this tracking code.'},
                            status=status.HTTP_404_NOT_FOUND)

        # تطبیق کد ملی مظنون (از فیلد ذخیره‌شده یا از خود suspect)
        suspect_nc = (report.suspect_national_code or '').strip()
        if not suspect_nc and report.suspect:
            suspect_nc = (report.suspect.national_code or '').strip()

        if suspect_nc != national_code:
            return Response({'error': 'National code does not match this tracking code.'},
                            status=status.HTTP_400_BAD_REQUEST)

        reporter_profile = getattr(report.reporter, 'profile', None)

        return Response({
            'tracking_code': report.tracking_code,
            'reward_amount': report.reward_amount,
            'suspect': {
                'full_name': report.suspect_full_name or (str(report.suspect) if report.suspect else ''),
                'national_code': suspect_nc,
            },
            'reporter': {
                'username': report.reporter.username,
                'national_code': reporter_profile.national_code if reporter_profile else None,
                'phone': reporter_profile.phone if reporter_profile else None,
            },
            'status': report.status,
            'is_paid': report.is_paid,
            'paid_at': report.paid_at,
        })
