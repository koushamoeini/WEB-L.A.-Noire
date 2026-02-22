from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    RoleViewSet, UserRoleUpdate, RegisterView, LoginView, 
    UserListView, MeView, SystemStatsView, NotificationViewSet,
    AdminUserViewSet, AdminStatsView
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('system-stats/', SystemStatsView.as_view(), name='system-stats'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('users/<int:user_pk>/roles/', UserRoleUpdate.as_view(), name='user-roles'),
]
