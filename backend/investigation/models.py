from django.db import models
from django.conf import settings
from cases.models import Case
from evidence.models import Evidence

class Suspect(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='suspects')
    name = models.CharField(max_length=255, verbose_name="نام متهم")
    details = models.TextField(verbose_name="جزئیات")
    is_main_suspect = models.BooleanField(default=False, verbose_name="متهم اصلی")
    is_on_board = models.BooleanField(default=False, verbose_name="روی تخته")

    def __str__(self):
        return f"{self.name} ({self.case.id})"

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
