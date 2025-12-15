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

## Summary of Work

Implemented key backend and frontend pieces to support a small demo authentication and role-management system. High-level areas completed:

- Project scaffold, environment, and developer tooling (venv, requirements)
- Authentication: registration and token-based login
- Role model + admin/API for role management (Persian display names with English codes)
- Default role seeding and a `reset_data` management command to flush and reseed roles
- Simple landing pages (register/login/dashboard) that call the backend APIs
- Documentation updates and basic operational run instructions

See `backend/README.md` for run commands and `REPORT.md`'s changelog for more details.
	 - `complainant` / شاکی
