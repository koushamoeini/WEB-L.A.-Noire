from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RoleViewSet, UserRoleUpdate, RegisterView, LoginView

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('users/<int:user_pk>/roles/', UserRoleUpdate.as_view(), name='user-roles'),
]
