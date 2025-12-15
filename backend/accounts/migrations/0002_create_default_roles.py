from django.db import migrations


def create_default_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    default_names = [
        'کارآموز',
        'پزشک قانونی',
        'افسر پلیس',
        'گشت',
        'کارآگاه',
        'گروهبان',
        'کاپیتان',
        'رییس پلیس',
    ]
    for name in default_names:
        Role.objects.get_or_create(name=name)


def reverse_default_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    names = [
        'کارآموز',
        'پزشک قانونی',
        'افسر پلیس',
        'گشت',
        'کارآگاه',
        'گروهبان',
        'کاپیتان',
        'رییس پلیس',
    ]
    Role.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_roles, reverse_default_roles),
    ]
