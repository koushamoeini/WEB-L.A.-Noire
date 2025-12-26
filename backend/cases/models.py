from django.db import models
from django.conf import settings

class Case(models.Model):
    class CrimeLevel(models.IntegerChoices):
        LEVEL_3 = 3, 'سطح ۳ (جرائم خرد)'
        LEVEL_2 = 2, 'سطح ۲ (جرائم بزرگ)'
        LEVEL_1 = 1, 'سطح ۱ (جرائم کلان)'
        CRITICAL = 0, 'سطح بحرانی'

    class Status(models.TextChoices):
        PENDING_TRAINEE = 'PT', 'در انتظار بررسی کارآموز'
        PENDING_OFFICER = 'PO', 'در انتظار تایید افسر'
        ACTIVE = 'AC', 'در جریان'
        REJECTED = 'RE', 'نیازمند اصلاح توسط شاکی'
        CANCELLED = 'CA', 'باطل شده'
        SOLVED = 'SO', 'مختومه'

    title = models.CharField(max_length=255, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    
    # Logic uses English (e.g. Case.CrimeLevel.CRITICAL)
    crime_level = models.IntegerField(
        choices=CrimeLevel.choices, 
        default=CrimeLevel.LEVEL_3,
        verbose_name="سطح جرم"
    )
    
    # Logic uses English (e.g. Case.Status.ACTIVE)
    status = models.CharField(
        max_length=2, 
        choices=Status.choices, 
        default=Status.PENDING_TRAINEE,
        verbose_name="وضعیت"
    )
    
    submission_attempts = models.PositiveSmallIntegerField(default=1)
    review_notes = models.TextField(blank=True, null=True, verbose_name="یادداشت داور")
    
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_cases')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.title}"

class CrimeScene(models.Model):
    case = models.OneToOneField(Case, on_delete=models.CASCADE, related_name='scene_data')
    occurrence_time = models.DateTimeField(verbose_name="زمان وقوع")
    location = models.CharField(max_length=255, verbose_name="محل وقوع")

class SceneWitness(models.Model):
    scene = models.ForeignKey(CrimeScene, on_delete=models.CASCADE, related_name='witnesses')
    phone = models.CharField(max_length=20, verbose_name="شماره تماس")
    national_code = models.CharField(max_length=10, verbose_name="کد ملی")
