from django.conf import settings
from django.db import models


class Role(models.Model):

    code = models.CharField(max_length=150, unique=True)
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='roles')

    class Meta:
        ordering = ['id']

    def __str__(self) -> str: 
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


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="کاربر"
    )
    title = models.CharField(max_length=255, verbose_name="عنوان")
    message = models.TextField(verbose_name="متن پیام")
    link = models.CharField(max_length=255, null=True, blank=True, verbose_name="لینک مرتبط")
    is_read = models.BooleanField(default=False, verbose_name="خوانده شده")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} for {self.user.username}"
