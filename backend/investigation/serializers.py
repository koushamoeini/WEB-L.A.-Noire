from rest_framework import serializers
from .models import Suspect, Interrogation, InterrogationFeedback, BoardConnection, Board, Verdict, Warrant

class WarrantSerializer(serializers.ModelSerializer):
    requester_name = serializers.ReadOnlyField(source='requester.username')
    approver_name = serializers.ReadOnlyField(source='approver.username')
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Warrant
        fields = '__all__'
        read_only_fields = ['requester', 'approver', 'status']

class VerdictSerializer(serializers.ModelSerializer):

    judge_username = serializers.ReadOnlyField(source='judge.username')
    result_display = serializers.CharField(source='get_result_display', read_only=True)

    class Meta:
        model = Verdict
        fields = '__all__'
        read_only_fields = ['judge']

class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = '__all__'

class InterrogationFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterrogationFeedback
        fields = '__all__'
        read_only_fields = ['captain']

class InterrogationSerializer(serializers.ModelSerializer):
    feedback = InterrogationFeedbackSerializer(read_only=True)
    class Meta:
        model = Interrogation
        fields = '__all__'
        read_only_fields = ['interrogator']

class SuspectSerializer(serializers.ModelSerializer):
    interrogations = InterrogationSerializer(many=True, read_only=True)
    class Meta:
        model = Suspect
        fields = '__all__'

class BoardConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardConnection
        fields = '__all__'

    def validate(self, data):
        if not data.get('from_suspect') and not data.get('from_evidence'):
            raise serializers.ValidationError("مبدا اتصال مشخص نشده است.")
        if not data.get('to_suspect') and not data.get('to_evidence'):
            raise serializers.ValidationError("مقصد اتصال مشخص نشده است.")
        return data
