from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Evidence, WitnessTestimony, BiologicalEvidence, 
    VehicleEvidence, IdentificationDocument, OtherEvidence, EvidenceImage
)
from .serializers import (
    EvidenceBaseSerializer,
    WitnessTestimonySerializer, BiologicalEvidenceSerializer, 
    VehicleEvidenceSerializer, IdentificationDocumentSerializer, OtherEvidenceSerializer,
    EvidenceImageSerializer
)
from cases.permissions import IsOfficerOrHigher

class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.all()
    serializer_class = EvidenceBaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset

    @action(detail=True, methods=['post'])
    def toggle_board(self, request, pk=None):
        evidence = self.get_object()
        evidence.is_on_board = not evidence.is_on_board
        evidence.save()
        return Response({'is_on_board': evidence.is_on_board})

class EvidenceBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrHigher]

    def perform_create(self, serializer):
        serializer.save(recorder=self.request.user)

    def get_queryset(self):
        """Allow filtering evidence by case ID via query params: ?case=1"""
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """Action to upload multiple images to a specific evidence record"""
        evidence = self.get_object()
        images = request.FILES.getlist('images')
        if not images:
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        for img in images:
            EvidenceImage.objects.create(evidence=evidence, image=img)
        return Response({'status': f'{len(images)} images uploaded successfully'})

    @action(detail=True, methods=['post'])
    def toggle_board(self, request, pk=None):
        evidence = self.get_object()
        evidence.is_on_board = not evidence.is_on_board
        evidence.save()
        return Response({'is_on_board': evidence.is_on_board})

class WitnessTestimonyViewSet(EvidenceBaseViewSet):
    queryset = WitnessTestimony.objects.all()
    serializer_class = WitnessTestimonySerializer

class BiologicalEvidenceViewSet(EvidenceBaseViewSet):
    queryset = BiologicalEvidence.objects.all()
    serializer_class = BiologicalEvidenceSerializer

class VehicleEvidenceViewSet(EvidenceBaseViewSet):
    queryset = VehicleEvidence.objects.all()
    serializer_class = VehicleEvidenceSerializer

class IdentificationDocumentViewSet(EvidenceBaseViewSet):
    queryset = IdentificationDocument.objects.all()
    serializer_class = IdentificationDocumentSerializer

class OtherEvidenceViewSet(EvidenceBaseViewSet):
    queryset = OtherEvidence.objects.all()
    serializer_class = OtherEvidenceSerializer
