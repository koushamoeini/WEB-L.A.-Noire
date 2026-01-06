from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Count
from .models import Case, CrimeScene, SceneWitness
from .serializers import CaseSerializer, WitnessSerializer
from .permissions import IsTrainee, IsOfficerOrHigher, IsSergeant, IsChief, IsDetective

class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = user.roles.values_list('code', flat=True)
        
        # Chiefs and Captains see everything
        if user.is_superuser or 'police_chief' in roles or 'captain' in roles:
            return Case.objects.all()
        
        # Combine filters based on roles
        queryset = Case.objects.none()
        
        # Trainees see cases pending their review
        if 'trainee' in roles:
            queryset |= Case.objects.filter(status=Case.Status.PENDING_TRAINEE)
            
        # Officers see cases pending their review
        if 'police_officer' in roles:
            queryset |= Case.objects.filter(status=Case.Status.PENDING_OFFICER)

        # Sergeants see cases pending resolution review
        if 'sergeant' in roles:
            queryset |= Case.objects.filter(status__in=[Case.Status.PENDING_OFFICER, Case.Status.PENDING_SERGEANT])

        # Detectives see active cases to investigate
        if 'detective' in roles:
            queryset |= Case.objects.filter(status__in=[Case.Status.ACTIVE, Case.Status.PENDING_SERGEANT])

        # Judges see all active cases
        if 'judge' in roles or 'qazi' in roles:
            queryset |= Case.objects.all()

        # Everyone sees cases they created or are involved in (Plaintiffs)
        queryset |= Case.objects.filter(Q(complainants=user) | Q(creator=user))

        return queryset.distinct()

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def trial_history(self, request, pk=None):
        """Aggregate all case data for the Judge's review (Section 6.4)"""
        case = self.get_object()
        
        # 1. Base case info
        data = {
            'case': CaseSerializer(case).data,
            'evidence': [],
            'suspects': [],
            'officers_involved': list(set([
                case.creator.username,
            ]))
        }

        # 2. Get All Evidence
        from evidence.models import Evidence
        from evidence.serializers import EvidenceBaseSerializer
        evidence_objs = Evidence.objects.filter(case=case)
        data['evidence'] = EvidenceBaseSerializer(evidence_objs, many=True).data

        # 3. Get All Suspects & Interrogations
        from investigation.models import Suspect
        from investigation.serializers import SuspectSerializer
        suspects = Suspect.objects.filter(case=case)
        data['suspects'] = SuspectSerializer(suspects, many=True).data

        # 4. Get Existing Verdicts
        from investigation.models import Verdict
        from investigation.serializers import VerdictSerializer
        verdicts = Verdict.objects.filter(case=case)
        data['verdicts'] = VerdictSerializer(verdicts, many=True).data

        return Response(data)

    def perform_create(self, serializer):
        case = serializer.save(creator=self.request.user)
        # If it's a complaint (not from scene), add creator as first complainant
        if case.status == Case.Status.PENDING_TRAINEE:
            case.complainants.add(self.request.user)
            from .models import CaseComplainant
            CaseComplainant.objects.create(case=case, user=self.request.user)

    @action(detail=True, methods=['post'])
    def resubmit(self, request, pk=None):
        """Plaintiff resubmits a rejected case with updated info"""
        case = self.get_object()
        if case.creator != request.user:
            return Response({'error': 'Only the creator can resubmit'}, status=status.HTTP_403_FORBIDDEN)
        if case.status != Case.Status.REJECTED:
            return Response({'error': 'Only rejected cases can be resubmitted'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Allow updating title and description during resubmission
        case.title = request.data.get('title', case.title)
        case.description = request.data.get('description', case.description)
        case.status = Case.Status.PENDING_TRAINEE
        case.save()
        return Response({'status': 'resubmitted', 'title': case.title})

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
        
        # Confirm/Reject specific complainants
        complainant_ids = request.data.get('confirmed_complainants', [])
        case.complainant_details.filter(user_id__in=complainant_ids).update(is_confirmed=True)
        case.complainant_details.exclude(user_id__in=complainant_ids).update(is_confirmed=False)
        
        return Response({'new_status': case.get_status_display()})

    @action(detail=True, methods=['post'], permission_classes=[IsOfficerOrHigher])
    def officer_review(self, request, pk=None):
        """Officer review logic (Section 4.2.1)"""
        case = self.get_object()
        approved = request.data.get('approved', False)
        if approved:
            case.status = Case.Status.ACTIVE
        else:
            # If officer rejects, it goes back to trainee, NOT plaintiff
            case.status = Case.Status.PENDING_TRAINEE
        case.review_notes = request.data.get('notes', '')
        case.save()
        return Response({'new_status': case.get_status_display()})

    @action(detail=True, methods=['post'])
    def add_complainant(self, request, pk=None):
        """Add plaintiff to an existing case (Section 4.2.2)"""
        case = self.get_object()
        user_id = request.data.get('user_id')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            case.complainants.add(user)
            from .models import CaseComplainant
            CaseComplainant.objects.get_or_create(case=case, user=user)
            return Response({'status': 'complainant added'})
        except User.DoesNotExist:
            return Response({'error': 'user not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsDetective])
    def submit_resolution(self, request, pk=None):
        """Detective submits case for resolution (Section 4.4)"""
        case = self.get_object()
        if case.status != Case.Status.ACTIVE:
            return Response({'error': 'Only active cases can be submitted for resolution'}, status=400)
        
        # Check if there's at least one main suspect
        if not case.suspects.filter(is_main_suspect=True).exists():
            return Response({'error': 'At least one main suspect must be identified'}, status=400)
            
        case.status = Case.Status.PENDING_SERGEANT
        case.save()
        return Response({'status': 'submitted_for_resolution'})

    @action(detail=True, methods=['post'], permission_classes=[IsSergeant])
    def sergeant_review(self, request, pk=None):
        """Sergeant reviews the detective's resolution (Section 4.4)"""
        case = self.get_object()
        approved = request.data.get('approved', False)
        notes = request.data.get('notes', '')
        
        if approved:
            # If critical, needs Chief's approval
            if case.crime_level == Case.CrimeLevel.CRITICAL:
                case.status = Case.Status.PENDING_CHIEF
            else:
                case.status = Case.Status.SOLVED
        else:
            case.status = Case.Status.ACTIVE # Back to detective
            
        case.review_notes = notes
        case.save()
        return Response({'status': 'reviewed_by_sergeant', 'new_status': case.status})

    @action(detail=True, methods=['post'], permission_classes=[IsChief])
    def chief_review(self, request, pk=None):
        """Chief reviews critical cases (Section 5.4)"""
        case = self.get_object()
        approved = request.data.get('approved', False)
        
        if approved:
            case.status = Case.Status.SOLVED
        else:
            case.status = Case.Status.ACTIVE
            
        case.save()
        return Response({'status': 'reviewed_by_chief', 'new_status': case.status})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Checkpoint 1: Aggregated Stats for Dashboard"""
        stats = Case.objects.aggregate(
            active=Count('id', filter=Q(status=Case.Status.ACTIVE)),
            solved=Count('id', filter=Q(status=Case.Status.SOLVED))
        )
        return Response({"پرونده‌های فعال": stats['active'], "پرونده‌های مختومه": stats['solved']})
