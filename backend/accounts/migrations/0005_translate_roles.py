from django.db import migrations


def translate_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
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

    Role.objects.exclude(name__in=default_roles).delete()
    for name in default_roles:
        Role.objects.get_or_create(name=name)


def reverse_translations(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_userprofile'),
    ]

    operations = [
        migrations.RunPython(translate_roles, reverse_translations),
    ]
