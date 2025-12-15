from django.db import migrations


def create_user_role(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.get_or_create(name='User')


def reverse_user_role(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name='User').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_create_default_roles'),
    ]

    operations = [
        migrations.RunPython(create_user_role, reverse_user_role),
    ]
