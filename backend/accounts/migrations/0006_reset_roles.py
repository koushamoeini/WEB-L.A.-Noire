from django.db import migrations


def reset_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.all().delete()
    persian_roles = [
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
    for name in persian_roles:
        Role.objects.create(name=name)


def reverse_reset(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_translate_roles'),
    ]

    operations = [
        migrations.RunPython(reset_roles, reverse_reset),
    ]
