from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        try:
            from .models import Role
            # default roles: (code, persian name)
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
            for code, name in default_roles:
                Role.objects.get_or_create(code=code, defaults={'name': name})
        except Exception:

            pass
