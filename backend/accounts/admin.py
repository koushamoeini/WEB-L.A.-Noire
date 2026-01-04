from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    # Show the id and (Persian) name so admins can reference IDs easily
    list_display = ('id', 'name', 'code', 'description')
    search_fields = ('name', 'code')
    ordering = ('id',)

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


class UserAdminForm(forms.ModelForm):
    roles = forms.ModelMultipleChoiceField(
        queryset=Role.objects.all().order_by('id'),
        required=False,
        widget=admin.widgets.FilteredSelectMultiple('Roles', is_stacked=False),
    )

    class Meta:
        model = User
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and getattr(self.instance, 'pk', None):
            self.fields['roles'].initial = self.instance.roles.all()

    def save(self, commit=True):
        user = super().save(commit=commit)
        if commit:
            user.roles.set(self.cleaned_data.get('roles', []))
        else:
            # Django Admin calls save(commit=False) then save_m2m()
            # We override save_m2m to include our custom roles field
            old_save_m2m = self.save_m2m
            def new_save_m2m():
                old_save_m2m()
                user.roles.set(self.cleaned_data.get('roles', []))
            self.save_m2m = new_save_m2m
        return user


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('id', 'username', 'email', 'is_active', 'is_superuser')
    ordering = ('id',)
    form = UserAdminForm

    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Roles', {'fields': ('roles',)}),
    )
