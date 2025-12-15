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


from django.contrib.auth import get_user_model


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = get_user_model()
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name')

    def create(self, validated_data):
        User = get_user_model()
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        # assign default role 'User' if it exists
        try:
            default_role, _ = Role.objects.get_or_create(name='User')
            user.roles.add(default_role)
        except Exception:
            pass
        return user
