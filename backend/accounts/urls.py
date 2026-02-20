from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    RoleViewSet, UserRoleUpdate, RegisterView, LoginView, 
    UserListView, MeView, UserStatsView, NotificationViewSet
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/stats/', UserStatsView.as_view(), name='user-stats'),
    path('users/<int:user_pk>/roles/', UserRoleUpdate.as_view(), name='user-roles'),
]
