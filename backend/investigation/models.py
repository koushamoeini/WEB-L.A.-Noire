from django.db import models
from django.conf import settings
from django.utils import timezone
from cases.models import Case
from evidence.models import Evidence

class Suspect(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='suspects')
    name = models.CharField(max_length=255, verbose_name="نام متهم", blank=True)
    first_name = models.CharField(max_length=150, blank=True, verbose_name="نام")
    last_name = models.CharField(max_length=150, blank=True, verbose_name="نام خانوادگی")
    national_code = models.CharField(max_length=10, blank=True, verbose_name="کد ملی")
    details = models.TextField(verbose_name="جزئیات")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="تاریخ شناسایی")
    is_main_suspect = models.BooleanField(default=False, verbose_name="متهم اصلی")
    is_on_board = models.BooleanField(default=False, verbose_name="روی تخته")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.case.id})"

class Interrogation(models.Model):
    suspect = models.ForeignKey(Suspect, on_delete=models.CASCADE, related_name='interrogations')
    interrogator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    transcript = models.TextField(verbose_name="متن بازجویی")
    score = models.PositiveSmallIntegerField(default=1, verbose_name="امتیاز (۱-۱۰)")
    created_at = models.DateTimeField(auto_now_add=True)

class InterrogationFeedback(models.Model):
    interrogation = models.OneToOneField(Interrogation, on_delete=models.CASCADE, related_name='feedback')
    captain = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    final_score = models.PositiveSmallIntegerField(verbose_name="امتیاز نهایی")
    is_confirmed = models.BooleanField(default=False, verbose_name="تایید شده")
    notes = models.TextField(blank=True, null=True)

class Board(models.Model):
    case = models.OneToOneField(Case, on_delete=models.CASCADE, related_name='board')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Board for Case {self.case.id}"

class BoardConnection(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='board_connections')
    
    # Connections can be between Evidence and Suspect, Evidence and Evidence, or Suspect and Suspect
    from_evidence = models.ForeignKey(Evidence, on_delete=models.CASCADE, null=True, blank=True, related_name='connections_from')
    from_suspect = models.ForeignKey(Suspect, on_delete=models.CASCADE, null=True, blank=True, related_name='connections_from')
    
    to_evidence = models.ForeignKey(Evidence, on_delete=models.CASCADE, null=True, blank=True, related_name='connections_to')
    to_suspect = models.ForeignKey(Suspect, on_delete=models.CASCADE, null=True, blank=True, related_name='connections_to')

    description = models.CharField(max_length=255, blank=True, verbose_name="علت اتصال")

class Verdict(models.Model):
    class Result(models.TextChoices):
        INNOCENT = 'INNOCENT', 'بی‌گناه'
        GUILTY = 'GUILTY', 'گناهکار'

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='verdicts')
    suspect = models.ForeignKey(Suspect, on_delete=models.CASCADE, related_name='verdicts')
    judge = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='judge_verdicts')
    
    title = models.CharField(max_length=255, verbose_name="عنوان حکم")
    result = models.CharField(max_length=10, choices=Result.choices, verbose_name="رای نهایی")
    punishment = models.TextField(blank=True, null=True, verbose_name="مجازات")
    description = models.TextField(verbose_name="توضیحات قاضی")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verdict for {self.suspect.name}: {self.result}"

class Warrant(models.Model):
    class WarrantType(models.TextChoices):
        ARREST = 'ARREST', 'حکم بازداشت'
        INTERROGATION = 'INTERROGATION', 'حکم بازجویی'
        SEARCH = 'SEARCH', 'حکم تفتیش'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'در انتظار بررسی'
        APPROVED = 'APPROVED', 'تایید شده'
        REJECTED = 'REJECTED', 'رد شده'

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='warrants')
    suspect = models.ForeignKey(Suspect, on_delete=models.SET_NULL, null=True, blank=True, related_name='warrants')
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='requested_warrants')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_warrants')
    
    type = models.CharField(max_length=20, choices=WarrantType.choices, default=WarrantType.INTERROGATION)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    description = models.TextField(verbose_name="علت درخواست حکم")
    approver_notes = models.TextField(blank=True, null=True, verbose_name="توضیحات تاییدکننده")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Warrant {self.type} for {self.suspect.name if self.suspect else 'Case '+str(self.case.id)} - {self.status}"


class RewardReport(models.Model):
    class Status(models.TextChoices):
        PENDING_OFFICER = 'PO', 'در انتظار بررسی افسر'
        PENDING_DETECTIVE = 'PD', 'در انتظار بررسی کارآگاه'
        APPROVED = 'AP', 'تایید نهایی'
        REJECTED = 'RE', 'رد شده'

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='reward_reports')
    suspect = models.ForeignKey(Suspect, on_delete=models.SET_NULL, null=True, blank=True, related_name='reward_reports')
    suspect_full_name = models.CharField(max_length=255, blank=True, verbose_name='نام متهم')
    suspect_national_code = models.CharField(max_length=10, blank=True, verbose_name='کد ملی متهم')
    description = models.TextField(verbose_name='توضیحات گزارش')

    status = models.CharField(max_length=2, choices=Status.choices, default=Status.PENDING_OFFICER)
    officer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reward_officer_reviews')
    officer_notes = models.TextField(blank=True, verbose_name='یادداشت افسر')
    detective = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reward_detective_reviews')
    detective_notes = models.TextField(blank=True, verbose_name='یادداشت کارآگاه')

    reward_amount = models.BigIntegerField(null=True, blank=True, verbose_name='مبلغ پاداش')
    tracking_code = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name='کد پیگیری')
    is_paid = models.BooleanField(default=False, verbose_name='پرداخت شده')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ پرداخت')
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reward_payments')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RewardReport #{self.id} - {self.get_status_display()}"

