from rest_framework import serializers
from .models import Case, CrimeScene, SceneWitness

class WitnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = SceneWitness
        fields = ['phone', 'national_code']

class CaseSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    level_label = serializers.CharField(source='get_crime_level_display', read_only=True)

    class Meta:
        model = Case
        fields = '__all__'
        read_only_fields = ['status', 'submission_attempts', 'creator']

class CrimeSceneSerializer(serializers.ModelSerializer):
    witnesses = WitnessSerializer(many=True)
    class Meta:
        model = Case
        fields = ['title', 'description', 'crime_level', 'witnesses']

