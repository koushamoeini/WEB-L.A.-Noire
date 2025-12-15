Backend (Django)

Run instructions (Windows PowerShell):

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Use `REPORT.md` for full documentation and API details.

بعد از اجرا، به http://127.0.0.1:8000/ مراجعه کنید تا صفحه‌ی اصلی با سه دکمه‌ی ثبت‌نام، ورود و داشبورد ادمین را ببینید. فرم‌های ثبت‌نام و ورود هر کدام در صفحات جداگانه قرار دارند و امکانات مدیریتی فعلاً از طریق `/admin/` فعال می‌شوند.

Resetting data
--------------

There is a destructive management command `reset_data` that will flush the database (removing all data, including superusers) and seed the Persian-only default roles (each role has an English `code` and a Persian `name`). Use only in development or when you explicitly want to wipe all data:

```powershell
python manage.py reset_data
python manage.py createsuperuser
```

New user registrations automatically receive the `base_user` role (`کاربر پایه`) by default; admins can add/remove roles from any user via `/admin/`.
