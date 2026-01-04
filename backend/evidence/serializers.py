from rest_framework import serializers
from .models import (
    Evidence, WitnessTestimony, BiologicalEvidence, 
    VehicleEvidence, IdentificationDocument, OtherEvidence, EvidenceImage
)

class EvidenceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidenceImage
        fields = ['id', 'image']

class EvidenceBaseSerializer(serializers.ModelSerializer):
    images = EvidenceImageSerializer(many=True, read_only=True)
    recorder_name = serializers.CharField(source='recorder.username', read_only=True)
    type_display = serializers.SerializerMethodField()

    class Meta:
        model = Evidence
        fields = ['id', 'case', 'title', 'description', 'recorded_at', 'recorder', 'recorder_name', 'images', 'is_on_board', 'type_display']
        read_only_fields = ['recorder']

    def get_type_display(self, obj):
        if hasattr(obj, 'witnesstestimony'): return "استشهاد شاهد"
        if hasattr(obj, 'biologicalevidence'): return "شواهد زیستی"
        if hasattr(obj, 'vehicleevidence'): return "وسایل نقلیه"
        if hasattr(obj, 'identificationdocument'): return "مدارک شناسایی"
        return "سایر موارد"

class WitnessTestimonySerializer(EvidenceBaseSerializer):
    class Meta(EvidenceBaseSerializer.Meta):
        model = WitnessTestimony
        fields = EvidenceBaseSerializer.Meta.fields + ['transcript', 'media']

class BiologicalEvidenceSerializer(EvidenceBaseSerializer):
    class Meta(EvidenceBaseSerializer.Meta):
        model = BiologicalEvidence
        fields = EvidenceBaseSerializer.Meta.fields + ['is_verified', 'medical_follow_up', 'database_follow_up']

class VehicleEvidenceSerializer(EvidenceBaseSerializer):
    class Meta(EvidenceBaseSerializer.Meta):
        model = VehicleEvidence
        fields = EvidenceBaseSerializer.Meta.fields + ['model_name', 'color', 'license_plate', 'serial_number']

class IdentificationDocumentSerializer(EvidenceBaseSerializer):
    class Meta(EvidenceBaseSerializer.Meta):
        model = IdentificationDocument
        fields = EvidenceBaseSerializer.Meta.fields + ['owner_full_name', 'extra_info']

class OtherEvidenceSerializer(EvidenceBaseSerializer):
    class Meta(EvidenceBaseSerializer.Meta):
        model = OtherEvidence
        fields = EvidenceBaseSerializer.Meta.fields
