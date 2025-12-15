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

بعد از اجرا، به http://127.0.0.1:8000/ مراجعه کنید تا صفحه‌ی ثبت‌نام کاربر عادی را ببینید. دسترسی به نقش‌ها و ورود مدیریتی از طریق پنل `/admin/` انجام می‌شود.
