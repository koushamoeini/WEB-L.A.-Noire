from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Ensure default roles exist on startup. Skip if DB isn't ready yet (migrations).
        try:
            from .models import Role
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
        except Exception:
            # OperationalError, ProgrammingError, or others may occur if migrations haven't run yet.
            # Silently ignore so migrations and test discovery proceed normally.
            pass
