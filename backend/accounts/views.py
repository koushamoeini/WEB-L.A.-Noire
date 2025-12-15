from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.generics import CreateAPIView
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Role
from .serializers import RegistrationSerializer, RoleSerializer, UserRoleSerializer


class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperUser()]
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class UserRoleUpdate(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request, user_pk):
        user_model = get_user_model()
        user = get_object_or_404(user_model, pk=user_pk)
        serializer = UserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.update(user, serializer.validated_data)
        return Response({'ok': True, 'roles': [r.name for r in user.roles.all()]})


class RegisterView(CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = []  # allow any
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        data = {'id': user.pk, 'username': user.username, 'token': token.key}
        return Response(data, status=status.HTTP_201_CREATED)

    def get(self, request, *args, **kwargs):
        # Redirect browser GETs to the HTML registration page for convenience
        return redirect('register')


class LoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        identifier = (request.data.get('identifier') or '').strip()
        password = request.data.get('password')
        if not identifier or not password:
            return Response({'detail': 'نام کاربری/کد ملی/شماره تماس/ایمیل و رمز عبور لازم است.'}, status=status.HTTP_400_BAD_REQUEST)
        user_model = get_user_model()
        user = (
            user_model.objects.filter(
                Q(username__iexact=identifier)
                | Q(email__iexact=identifier)
                | Q(profile__national_code=identifier)
                | Q(profile__phone=identifier)
            )
            .distinct()
            .first()
        )
        if not user or not user.check_password(password):
            return Response({'detail': 'اطلاعات ورود نامعتبر است.'}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'id': user.pk, 'username': user.username})

    def get(self, request, *args, **kwargs):
        # Redirect browser GETs to the HTML login page for convenience
        return redirect('login')
