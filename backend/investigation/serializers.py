from rest_framework import serializers
from django.utils import timezone
from .models import Suspect, Interrogation, InterrogationFeedback, BoardConnection, Board, Verdict, Warrant, RewardReport
from cases.models import Case

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

class SuspectStatusSerializer(serializers.ModelSerializer):
    case_title = serializers.CharField(source='case.title', read_only=True)
    case_status = serializers.CharField(source='case.status', read_only=True)
    case_status_label = serializers.CharField(source='case.get_status_display', read_only=True)
    crime_level = serializers.IntegerField(source='case.crime_level', read_only=True)
    crime_level_label = serializers.CharField(source='case.get_crime_level_display', read_only=True)
    pursuit_days = serializers.SerializerMethodField()
    is_under_pursuit = serializers.SerializerMethodField()
    is_severe_pursuit = serializers.SerializerMethodField()
    pursuit_score = serializers.SerializerMethodField()
    reward_amount = serializers.SerializerMethodField()

    class Meta:
        model = Suspect
        fields = [
            'id', 'name', 'first_name', 'last_name', 'national_code',
            'case', 'case_title', 'case_status', 'case_status_label',
            'crime_level', 'crime_level_label',
            'pursuit_days', 'is_under_pursuit', 'is_severe_pursuit',
            'pursuit_score', 'reward_amount',
        ]

    def _is_case_open(self, obj):
        if not obj.case_id:
            return False
        return obj.case.status in {
            Case.Status.PENDING_TRAINEE,
            Case.Status.PENDING_OFFICER,
            Case.Status.ACTIVE,
            Case.Status.PENDING_SERGEANT,
            Case.Status.PENDING_CHIEF,
        }

    def _pursuit_days_value(self, obj):
        if not self._is_case_open(obj):
            return 0
        if not obj.created_at:
            return 0
        delta = timezone.now() - obj.created_at
        return max(delta.days, 0)

    def _crime_level_score(self, obj):
        if not obj.case_id:
            return 0
        if obj.case.crime_level == Case.CrimeLevel.LEVEL_3:
            return 1
        if obj.case.crime_level == Case.CrimeLevel.LEVEL_2:
            return 2
        if obj.case.crime_level == Case.CrimeLevel.LEVEL_1:
            return 3
        if obj.case.crime_level == Case.CrimeLevel.CRITICAL:
            return 4
        return 0

    def get_pursuit_days(self, obj):
        return self._pursuit_days_value(obj)

    def get_is_under_pursuit(self, obj):
        return self._is_case_open(obj)

    def get_is_severe_pursuit(self, obj):
        return self._pursuit_days_value(obj) > 30

    def get_pursuit_score(self, obj):
        days = self._pursuit_days_value(obj)
        return days * self._crime_level_score(obj)

    def get_reward_amount(self, obj):
        return self.get_pursuit_score(obj) * 20000000





class RewardReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.ReadOnlyField(source='reporter.username')
    officer_name = serializers.ReadOnlyField(source='officer.username')
    detective_name = serializers.ReadOnlyField(source='detective.username')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RewardReport
        fields = '__all__'
        read_only_fields = [
            'reporter', 'officer', 'detective',
            'reward_amount', 'tracking_code',
            'is_paid', 'paid_at', 'paid_by',
            'created_at', 'updated_at',
        ]

