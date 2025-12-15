from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Flush the database and seed default Persian roles (English code, Persian name).'

    def handle(self, *args, **options):
        from accounts.models import Role

        default_roles = [
            ('system_admin', 'مدیر کل سامانه'),
            ('police_chief', 'رییس پلیس'),
            ('captain', 'کاپیتان'),
            ('sergeant', 'گروهبان'),
            ('workshop', 'کارگاه'),
            ('police_officer', 'مامور پلیس'),
            ('patrol_officer', 'افسر گشت'),
            ('trainee', 'کارآموز'),
            ('complainant', 'شاکی'),
            ('witness', 'شاهد'),
            ('criminal', 'مجرم'),
            ('suspect', 'متهم'),
            ('judge', 'قاضی'),
            ('forensic_doctor', 'پزشک قانونی'),
            ('base_user', 'کاربر پایه'),
        ]

        self.stdout.write(self.style.WARNING('Flushing database (removes all data, including superusers)'))
        call_command('flush', '--no-input')

        Role.objects.all().delete()
        Role.objects.bulk_create([Role(code=code, name=name) for code, name in default_roles])
        self.stdout.write(self.style.SUCCESS(
            f'Seeded {len(default_roles)} roles. Remember to create a superuser.'
        ))
