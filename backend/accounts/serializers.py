from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role, UserProfile


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'code', 'name', 'description']


class UserRoleSerializer(serializers.Serializer):
    roles = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True)

    def update(self, instance, validated_data):
        roles = validated_data.get('roles', [])
        instance.roles.set(roles)
        return instance



def _digits(value):
    return ''.join(ch for ch in (value or '') if ch.isdigit())


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    national_code = serializers.CharField(write_only=True)
    email = serializers.EmailField()

    class Meta:
        model = get_user_model()
        fields = (
            'id',
            'username',
            'password',
            'email',
            'phone',
            'national_code',
        )

    def validate_phone(self, value):
        cleaned = _digits(value)
        if len(cleaned) < 10:
            raise serializers.ValidationError('شماره تماس باید حداقل ۱۰ رقم باشد.')
        if UserProfile.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError('این شماره تماس قبلا استفاده شده است.')
        return cleaned

    def validate_national_code(self, value):
        cleaned = _digits(value)
        if len(cleaned) != 10:
            raise serializers.ValidationError('کد ملی باید دقیقا ۱۰ رقم باشد.')
        if UserProfile.objects.filter(national_code=cleaned).exists():
            raise serializers.ValidationError('این کد ملی قبلا ثبت شده است.')
        return cleaned

    def validate_username(self, value):
        if get_user_model().objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('نام کاربری قبلا گرفته شده است.')
        return value

    def validate_email(self, value):
        if get_user_model().objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('ایمیل قبلا ثبت شده است.')
        return value

    def create(self, validated_data):
        User = get_user_model()
        password = validated_data.pop('password')
        phone = validated_data.pop('phone')
        national_code = validated_data.pop('national_code')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(
            user=user,
            phone=phone,
            national_code=national_code,
        )
        # assign default Persian role 'کاربر پایه' via english `code='base_user'`
        try:
            default_role, _ = Role.objects.get_or_create(
                code='base_user', defaults={'name': 'کاربر پایه'}
            )
            user.roles.add(default_role)
        except Exception:
            pass
        return user
