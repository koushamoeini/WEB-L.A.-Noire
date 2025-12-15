from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    # Show the id and (Persian) name so admins can reference IDs easily
    list_display = ('id', 'name', 'code', 'description')
    search_fields = ('name', 'code')

    def has_change_permission(self, request, obj=None):
        # Only superusers can modify roles/role membership
        return request.user.is_active and request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_active and request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_active and request.user.is_superuser


# Customize the User admin to show the 'id' column as well
User = get_user_model()
try:
    admin.site.unregister(User)
except Exception:
    pass


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('id', 'username', 'email', 'is_active', 'is_superuser')
