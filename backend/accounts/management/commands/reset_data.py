from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Flush every record from the database and re-create the default Persian roles'

    def handle(self, *args, **options):
        from accounts.models import Role

        default_roles = [
            'مدیر کل سامانه',
            'رییس پلیس',
            'کاپیتان',
            'گروهبان',
            'کارآگاه',
            'مامور پلیس و افسر گشت',
            'کارآموز',
            'شاکی و شاهد',
            'متهم و مجرم',
            'قاضی',
            'پزشک قانونی',
            'کاربر پایه',
        ]

        self.stdout.write(self.style.WARNING('Flushing database (this removes every record, including superusers)'))
        call_command('flush', '--no-input')

        Role.objects.all().delete()
        Role.objects.bulk_create([Role(name=name) for name in default_roles])
        self.stdout.write(self.style.SUCCESS(
            f'Flushed the database and re-created {len(default_roles)} default roles. Create a new superuser as needed.'
        ))
