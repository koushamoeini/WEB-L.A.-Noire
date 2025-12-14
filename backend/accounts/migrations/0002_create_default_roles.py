from django.db import migrations


def create_default_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    default_names = [
        'Trainee',
        'Forensic Doctor',
        'Police Officer',
        'Patrol Officer',
        'Detective',
        'Sergeant',
        'Captain',
        'Police Chief',
    ]
    for name in default_names:
        Role.objects.get_or_create(name=name)


def reverse_default_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    names = [
        'Trainee',
        'Forensic Doctor',
        'Police Officer',
        'Patrol Officer',
        'Detective',
        'Sergeant',
        'Captain',
        'Police Chief',
    ]
    Role.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_roles, reverse_default_roles),
    ]
