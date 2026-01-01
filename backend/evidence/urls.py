from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WitnessTestimonyViewSet, BiologicalEvidenceViewSet, 
    VehicleEvidenceViewSet, IdentificationDocumentViewSet, OtherEvidenceViewSet
)

router = DefaultRouter()
router.register(r'witness', WitnessTestimonyViewSet)
router.register(r'biological', BiologicalEvidenceViewSet)
router.register(r'vehicle', VehicleEvidenceViewSet)
router.register(r'id-document', IdentificationDocumentViewSet)
router.register(r'other', OtherEvidenceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
