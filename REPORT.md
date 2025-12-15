## Contributions

kousha:
- Project scaffold and environment setup
- Implemented `Role` model and admin restrictions; added DRF endpoints for role management and assignment
- Seeded default roles and added `User` role for default assignment
- Implemented registration and token-based login; new users receive `User` role on register
- Added Docker placeholders and documentation; created `REPORT.md`
- Removed tests from the repository (per request)
- Added a server-served landing page that calls the `/api/` endpoints for registration, login, and roles so the demo content stays with the backend.

---

## Responsibilities & Work Done (so far)

kousha:
- Project scaffold and environment setup
- Role model and admin-restricted role management API
- Default role seeding and registration/token login

## Development Conventions

- Python virtual environment located in `backend/venv`.
- Use `requirements.txt` to pin server dependencies; `Django` and `djangorestframework` are primary packages.
- Keep migrations checked into source control and use data migrations to seed required domain data (e.g. default roles).
- Minimal, focused commits per logical change; documentation updates alongside implementation changes.


## Key System Entities and Rationale

- `Role`: central model representing a named role within the system. Fields: `name` (unique), `description` (free text), `users` (Many-to-Many to the user model). Rationale: simple role-based assignment lets admins tag users with roles without coupling permissions logic to the role object itself.
 - `Role`: central model representing a named role within the system. Fields: `code` (English slug, unique), `name` (Persian display label, unique), `description` (free text), `users` (Many-to-Many to the user model). Rationale: the `code` is used internally and in scripts while `name` is the Persian label shown in the UI; admins can add/remove roles via `/admin/` or the API.
- `User` (Django auth): application users. On registration, users are assigned a default `User` role so the system has a clear baseline for identity-related behavior.

## Top Packages Used

- `Django` — proven, batteries-included web framework.
- `djangorestframework` — for the REST API endpoints.
- `djangorestframework-authtoken` — token-based authentication for simple mobile/API clients.

## Representative Code Samples

_To be added later._

## Strengths & Weaknesses

_To be added later._

## Initial & Current Requirements

- Initial: scaffolded the backend, established Python tooling, installed Django, implemented the basic role system and Docker placeholders, and added an inline landing page that exercises the login/roles APIs.
- Current (completed): role structure implemented, default roles seeded, registration and token-based login implemented, documentation and report template added.
 - Default roles seeded: the project seeds a Persian-only role set (each role has an English `code` + Persian `name`). The defaults are:
	 - `system_admin` / مدیر کل سامانه
	 - `police_chief` / رییس پلیس
	 - `captain` / کاپیتان
	 - `sergeant` / گروهبان
	 - `workshop` / کارگاه
	 - `police_officer` / مامور پلیس
	 - `patrol_officer` / افسر گشت
	 - `complainant` / شاکی
	 - `witness` / شاهد
	 - `criminal` / مجرم
	 - `suspect` / متهم
	 - `judge` / قاضی
	 - `forensic_doctor` / پزشک قانونی
	 - `base_user` / کاربر پایه

 - Registration behavior: when a user registers, they are automatically assigned the default role `base_user` (Persian label `کاربر پایه`). The main superuser can change any user's roles via the admin or API.

## Deployment & Maintenance Notes

- Apply migrations: `python manage.py migrate` (this also seeds the default roles).
 - Apply migrations: `python manage.py migrate` (this also creates schema). To reset data and re-seed the default Persian roles use the management command described below.
- Create a superuser to manage roles via `/admin/` or via `/api/roles/` endpoints.
- Run server: `python manage.py runserver` and use the documented API endpoints for registration and login.
- Visit http://127.0.0.1:8000/ after the server starts to reach the built-in landing page for login and role management.

## Run Instructions (quick)

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Resetting Data and Re-seeding Roles

A destructive management command `reset_data` is available to flush the entire database and re-seed the Persian default roles. This removes all records including superusers. Use with caution on any environment that is not ephemeral development.

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py reset_data
# recreate an admin
python manage.py createsuperuser
```

The command seeds the role set listed above; roles are stored with an English `code` and a Persian `name` so they show in Persian throughout the admin and frontend, but programmatic code can rely on the English `code`.

---

*Contributions credited to `kousha`.*
