Backend (Django)

This folder will contain the Django project.

To create and activate venv on Windows (PowerShell):

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

To run Django dev server:

```powershell
cd backend
venv\Scripts\Activate.ps1
python manage.py runserver
```

Docker:

- I created a placeholder `Dockerfile` in this folder. It's empty now — add build instructions when ready.
- To run containers you'll need Docker Desktop installed on Windows. See https://docs.docker.com/desktop/install/windows/ for instructions.
