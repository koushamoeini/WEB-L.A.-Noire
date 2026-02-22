from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role, UserProfile, Notification


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'code', 'name', 'description']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserRoleSerializer(serializers.Serializer):
    roles = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True)

    def update(self, instance, validated_data):
        roles = validated_data.get('roles', [])
        instance.roles.set(roles)
        return instance


class AdminUserSerializer(serializers.ModelSerializer):
    """Comprehensive user serializer for admin panel."""
    roles = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True, required=False)
    role_names = serializers.SerializerMethodField(read_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    national_code = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = get_user_model()
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'is_active', 'is_superuser', 'date_joined', 'last_login',
            'roles', 'role_names', 'phone', 'national_code', 'password'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_role_names(self, obj):
        return [{'id': r.id, 'code': r.code, 'name': r.name} for r in obj.roles.all()]

    def validate_username(self, value):
        if self.instance and self.instance.username == value:
            return value
        if get_user_model().objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('نام کاربری قبلا گرفته شده است.')
        return value

    def validate_email(self, value):
        if not value:
            return value
        if self.instance and self.instance.email == value:
            return value
        if get_user_model().objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('ایمیل قبلا ثبت شده است.')
        return value

    def create(self, validated_data):
        roles_data = validated_data.pop('roles', [])
        phone = validated_data.pop('phone', '')
        national_code = validated_data.pop('national_code', '')
        password = validated_data.pop('password', None)
        
        User = get_user_model()
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
        else:
            user.set_password('defaultpassword123')
        user.save()
        
        # Create profile
        UserProfile.objects.create(
            user=user,
            phone=''.join(ch for ch in phone if ch.isdigit()) if phone else '',
            national_code=''.join(ch for ch in national_code if ch.isdigit()) if national_code else '',
        )
        
        # Set roles
        if roles_data:
            user.roles.set(roles_data)
        
        return user

    def update(self, instance, validated_data):
        roles_data = validated_data.pop('roles', None)
        phone = validated_data.pop('phone', None)
        national_code = validated_data.pop('national_code', None)
        password = validated_data.pop('password', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update profile
        if phone is not None or national_code is not None:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            if phone is not None:
                profile.phone = ''.join(ch for ch in phone if ch.isdigit())
            if national_code is not None:
                profile.national_code = ''.join(ch for ch in national_code if ch.isdigit())
            profile.save()
        
        # Update roles
        if roles_data is not None:
            instance.roles.set(roles_data)
        
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
            'email',            'first_name',
            'last_name',            'phone',
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
