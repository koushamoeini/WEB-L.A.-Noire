from django.contrib import admin

# Register your models here.

from .models import RewardReport


@admin.register(RewardReport)
class RewardReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'reporter', 'suspect_full_name', 'reward_amount', 'tracking_code', 'is_paid')
    list_filter = ('status', 'is_paid')
    search_fields = ('suspect_full_name', 'suspect_national_code', 'tracking_code')

