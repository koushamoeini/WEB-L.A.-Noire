from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Count
from .models import Case, CrimeScene, SceneWitness
from .serializers import CaseSerializer, WitnessSerializer
from .permissions import IsTrainee, IsOfficerOrHigher

class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.roles.filter(code__in=['police_chief', 'captain']).exists():
            return Case.objects.all()
        return Case.objects.filter(Q(complainants=user) | Q(creator=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[IsOfficerOrHigher])
    def create_from_scene(self, request):
        """Route 4.2.2: Crime Scene Registration"""
        data = request.data
        # Shortcut: Chief bypasses approval
        is_chief = request.user.roles.filter(code='police_chief').exists()
        case_status = Case.Status.ACTIVE if is_chief else Case.Status.PENDING_OFFICER
        
        case = Case.objects.create(
            title=data['title'], description=data['description'],
            crime_level=data['crime_level'], creator=request.user, status=case_status
        )
        scene = CrimeScene.objects.create(
            case=case, location=data['location'], occurrence_time=data['occurrence_time']
        )
        for w in data.get('witnesses', []):
            SceneWitness.objects.create(scene=scene, **w)
        return Response(CaseSerializer(case).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsTrainee])
    def trainee_review(self, request, pk=None):
        """Logic for 3-strike rule (Section 4.2.1)"""
        case = self.get_object()
        approved = request.data.get('approved', False)
        if approved:
            case.status = Case.Status.PENDING_OFFICER
        else:
            case.submission_attempts += 1
            case.status = Case.Status.CANCELLED if case.submission_attempts >= 3 else Case.Status.REJECTED
        case.review_notes = request.data.get('notes', '')
        case.save()
        return Response({'new_status': case.get_status_display()})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Checkpoint 1: Aggregated Stats for Dashboard"""
        stats = Case.objects.aggregate(
            active=Count('id', filter=Q(status=Case.Status.ACTIVE)),
            solved=Count('id', filter=Q(status=Case.Status.SOLVED))
        )
        return Response({"پرونده‌های فعال": stats['active'], "پرونده‌های مختومه": stats['solved']})
