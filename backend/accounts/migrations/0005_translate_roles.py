from django.db import migrations


def translate_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    translations = {
        'Trainee': 'کارآموز',
        'Forensic Doctor': 'پزشک قانونی',
        'Police Officer': 'افسر پلیس',
        'Patrol Officer': 'گشت',
        'Detective': 'کارآگاه',
        'Sergeant': 'گروهبان',
        'Captain': 'کاپیتان',
        'Police Chief': 'رییس پلیس',
        'User': 'کاربر عادی',
    }
    for source, target in translations.items():
        role = Role.objects.filter(name=source).first()
        if not role:
            continue
        if Role.objects.filter(name=target).exists():
            role.delete()
            continue
        role.name = target
        role.save()


def reverse_translations(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    reverse_map = {
        'کارآموز': 'Trainee',
        'پزشک قانونی': 'Forensic Doctor',
        'افسر پلیس': 'Police Officer',
        'گشت': 'Patrol Officer',
        'کارآگاه': 'Detective',
        'گروهبان': 'Sergeant',
        'کاپیتان': 'Captain',
        'رییس پلیس': 'Police Chief',
        'کاربر عادی': 'User',
    }
    for source, target in reverse_map.items():
        role = Role.objects.filter(name=source).first()
        if not role:
            continue
        if Role.objects.filter(name=target).exists():
            role.delete()
            continue
        role.name = target
        role.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_userprofile'),
    ]

    operations = [
        migrations.RunPython(translate_roles, reverse_translations),
    ]
