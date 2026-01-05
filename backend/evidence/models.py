from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from cases.models import Case

class Evidence(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='all_evidences')
    title = models.CharField(max_length=255, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    recorded_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    recorder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name="ثبت‌کننده")
    is_on_board = models.BooleanField(default=False, verbose_name="روی تخته")

    def __str__(self):
        return f"{self.title} ({self.case.id})"

class WitnessTestimony(Evidence):
    transcript = models.TextField(verbose_name="رونوشت صحبت‌ها")
    media = models.FileField(upload_to='evidence/witness/', null=True, blank=True, verbose_name="فایل مرتبط")

class BiologicalEvidence(Evidence):
    is_verified = models.BooleanField(default=False, verbose_name="تایید شده")
    medical_follow_up = models.TextField(null=True, blank=True, verbose_name="نتیجه پیگیری پزشکی")
    database_follow_up = models.TextField(null=True, blank=True, verbose_name="نتیجه پیگیری بانک داده")

class VehicleEvidence(Evidence):
    model_name = models.CharField(max_length=100, verbose_name="مدل")
    color = models.CharField(max_length=50, verbose_name="رنگ")
    license_plate = models.CharField(max_length=20, null=True, blank=True, verbose_name="شماره پلاک")
    serial_number = models.CharField(max_length=50, null=True, blank=True, verbose_name="شماره سریال")

    def clean(self):
        if self.license_plate and self.serial_number:
            raise ValidationError("شماره پلاک و شماره سریال نمی‌توانند همزمان مقدار داشته باشند.")
        if not self.license_plate and not self.serial_number:
            raise ValidationError("باید حداقل یکی از موارد شماره پلاک یا شماره سریال وارد شود.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class IdentificationDocument(Evidence):
    owner_full_name = models.CharField(max_length=255, verbose_name="نام کامل صاحب مدرک")
    extra_info = models.JSONField(default=dict, blank=True, verbose_name="اطلاعات تکمیلی")

class OtherEvidence(Evidence):
    pass

class EvidenceImage(models.Model):
    evidence = models.ForeignKey(Evidence, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='evidence/images/')
