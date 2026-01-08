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
