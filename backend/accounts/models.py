from django.conf import settings
from django.db import models


class Role(models.Model):
    """Simple Role model. Roles can be assigned to users via a M2M."""
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='roles')

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    national_code = models.CharField(max_length=12, unique=True)
    phone = models.CharField(max_length=30, unique=True)

    def __str__(self) -> str:
        return f"{self.user.username} profile"
