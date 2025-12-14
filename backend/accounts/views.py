from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Role
from .serializers import RoleSerializer, UserRoleSerializer


class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # anyone authenticated can list/ retrieve; only superuser can create/modify
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperUser()]
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
