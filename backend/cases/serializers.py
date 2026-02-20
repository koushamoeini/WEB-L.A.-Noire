from rest_framework import serializers
from .models import Case, CrimeScene, SceneWitness, CaseComplainant

class WitnessSerializer(serializers.ModelSerializer):


    class Meta:
        model = SceneWitness
        fields = ['phone', 'national_code']

class CaseComplainantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    class Meta:
        model = CaseComplainant
        fields = ['user', 'username', 'first_name', 'last_name', 'is_confirmed']

class CrimeSceneSerializer(serializers.ModelSerializer):
    witnesses = WitnessSerializer(many=True, read_only=True)
    class Meta:
        model = CrimeScene
        fields = ['occurrence_time', 'location', 'witnesses']

class CaseSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    level_label = serializers.CharField(source='get_crime_level_display', read_only=True)
    complainant_details = CaseComplainantSerializer(many=True, read_only=True)
    scene_data = CrimeSceneSerializer(read_only=True)
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_name = serializers.SerializerMethodField(read_only=True)

    def get_creator_name(self, obj):
        if not obj.creator: return None
        return f"{obj.creator.first_name} {obj.creator.last_name}".strip() or obj.creator.username

    class Meta:
        model = Case
        fields = [
            'id', 'title', 'description', 'crime_level', 'level_label', 
            'status', 'status_label', 'submission_attempts', 'review_notes', 
            'creator', 'creator_username', 'creator_name', 
            'complainants', 'complainant_details', 'scene_data', 'created_at'
        ]
        read_only_fields = ['status', 'submission_attempts', 'creator']

