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
