from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from cases.models import Case
from investigation.models import Suspect, Interrogation, BoardConnection
from evidence.models import Evidence, OtherEvidence, VehicleEvidence

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds a comprehensive test case with suspect, evidence, and investigation board setup.'

    def handle(self, *args, **kwargs):
        admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
        if not admin_user:
            self.stderr.write('No users found in database. Create a user first.')
            return

        # 1. Create a Case (Critical Crime Level)
        case_title = "سرقت از جواهری پارسا (پرونده تستی)"
        case_desc = "سرقت مسلحانه همراه با گروگان‌گیری در جواهری مرکزی. سارقین با استفاده از یک خودروی مشکی از صحنه متواری شدند. شواهد نشان‌دهنده برنامه‌ریزی قبلی است."
        
        case, created = Case.objects.get_or_create(
            title=case_title,
            defaults={
                'description': case_desc,
                'crime_level': Case.CrimeLevel.CRITICAL,
                'status': Case.Status.ACTIVE,
                'creator': admin_user,
            }
        )
        if not created:
            self.stdout.write(f'Case "{case_title}" already exists. Updating...')
            case.status = Case.Status.ACTIVE
            case.save()

        # 2. Create a Suspect with > 30 days pursuit
        pursuit_start = timezone.now() - timedelta(days=45)
        suspect, s_created = Suspect.objects.get_or_create(
            case=case,
            national_code="1234567890",
            defaults={
                'first_name': "منصور",
                'last_name': "کلاهبردار",
                'details': "سابقه کیفری در زمینه سرقت و جعل اسناد. بسیار خطرناک و مسلح.",
                'is_main_suspect': True,
                'is_on_board': True,
            }
        )
        suspect.created_at = pursuit_start
        suspect.save()

        # 3. Create Evidence
        ev1, e1_created = OtherEvidence.objects.get_or_create(
            case=case,
            title="پوکه فشنگ ۹ میلی‌متری",
            defaults={
                'description': "یافت شده در نزدیکی ویترین شکسته شده.",
                'recorder': admin_user,
                'is_on_board': True,
            }
        )

        ev2, e2_created = VehicleEvidence.objects.get_or_create(
            case=case,
            title="رد تایر مشکوک",
            defaults={
                'description': "تصویر رد تایر در خروجی پارکینگ جواهری.",
                'recorder': admin_user,
                'is_on_board': True,
                'model_name': "Mazda 3",
                'color': "Black",
                'license_plate': "44B789-Iran99",
            }
        )

        # 4. Create Interrogation
        Interrogation.objects.get_or_create(
            suspect=suspect,
            interrogator=admin_user,
            defaults={
                'transcript': "مظنون هرگونه دخالت در سرقت را انکار می‌کند اما در مورد محل حضورش در شب سرقت دچار تناقض گویی شده است.",
                'score': 7,
            }
        )

        # 5. Create Board Connections (connecting evidence to suspect)
        BoardConnection.objects.get_or_create(
            case=case,
            from_evidence=ev1,
            to_suspect=suspect,
            defaults={'description': "فشنگ متعلق به اسلحه ثبت شده به نام منصور است."}
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded case ID: {case.id}'))
        self.stdout.write(self.style.SUCCESS(f'Suspect "Mansur Klahbardar" is now in intensive pursuit (45 days).'))
