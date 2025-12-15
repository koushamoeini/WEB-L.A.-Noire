## Contributions

kousha:
- Project scaffold and environment setup
- Implemented `Role` model and admin restrictions; added DRF endpoints for role management and assignment
- Seeded default roles and added `User` role for default assignment
- Implemented registration and token-based login; new users receive `User` role on register
- Added Docker placeholders and documentation; created `REPORT.md` template
- Removed tests from the repository (per request)

---

## Responsibilities & Work Done (so far)

kousha:
- Project scaffold and environment setup
- Role model and admin-restricted role management API
- Default role seeding and registration/token login

## Development Conventions

- Python virtual environments per service (`backend/venv` and `frontend/venv`).
- Use `requirements.txt` to pin server dependencies; `Django` and `djangorestframework` are primary packages.
- Keep migrations checked into source control and use data migrations to seed required domain data (e.g. default roles).
- Minimal, focused commits per logical change; documentation updates alongside implementation changes.


## Key System Entities and Rationale

- `Role`: central model representing a named role within the system. Fields: `name` (unique), `description` (free text), `users` (Many-to-Many to the user model). Rationale: simple role-based assignment lets admins tag users with roles without coupling permissions logic to the role object itself.
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

- Initial: scaffold frontend/backend, set up venvs, install Django, implement basic role system and Docker placeholders.
- Current (completed): role structure implemented, default roles seeded, registration and token-based login implemented, documentation and report template added.

## Deployment & Maintenance Notes

- Apply migrations: `python manage.py migrate` (this also seeds the default roles).
- Create a superuser to manage roles via `/admin/` or via `/api/roles/` endpoints.
- Run server: `python manage.py runserver` and use the documented API endpoints for registration and login.

## Run Instructions (quick)

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

*Contributions credited to `kousha`.*
