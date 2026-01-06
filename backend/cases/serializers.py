from rest_framework import serializers
from .models import Case, CrimeScene, SceneWitness, CaseComplainant, Payment

class PaymentSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['user', 'is_paid', 'transaction_id']

class WitnessSerializer(serializers.ModelSerializer):

    class Meta:
        model = SceneWitness
        fields = ['phone', 'national_code']

class CaseComplainantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = CaseComplainant
        fields = ['user', 'username', 'is_confirmed']

class CaseSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    level_label = serializers.CharField(source='get_crime_level_display', read_only=True)
    complainant_details = CaseComplainantSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = '__all__'
        read_only_fields = ['status', 'submission_attempts', 'creator']

class CrimeSceneSerializer(serializers.ModelSerializer):
    witnesses = WitnessSerializer(many=True)
    class Meta:
        model = Case
        fields = ['title', 'description', 'crime_level', 'witnesses']

