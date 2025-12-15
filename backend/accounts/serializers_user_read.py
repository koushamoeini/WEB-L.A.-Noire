from django.contrib.auth import get_user_model
from rest_framework import serializers

class UserReadSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ('id', 'username', 'email', 'roles')

    def get_roles(self, obj):
        return list(obj.roles.values_list('id', flat=True))
