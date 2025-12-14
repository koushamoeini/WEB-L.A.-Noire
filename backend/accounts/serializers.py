from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']


class UserRoleSerializer(serializers.Serializer):
    roles = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True)

    def update(self, instance, validated_data):
        roles = validated_data.get('roles', [])
        instance.roles.set(roles)
        return instance
