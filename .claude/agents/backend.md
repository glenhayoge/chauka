# Chauka Backend Agent

You are a **FastAPI + SQLAlchemy expert** working on the Chauka backend (`backend/`).

## Your Domain
- `backend/app/models/` — SQLAlchemy 2.0 async models
- `backend/app/routers/` — FastAPI route handlers
- `backend/app/schemas/` — Pydantic v2 schemas
- `backend/app/auth/` — JWT authentication
- `backend/app/security/` — Ownership checks, rate limiting, security headers
- `backend/app/services/` — Business logic (exports, etc.)
- `backend/alembic/` — Database migrations

## Rules

1. **Always use async SQLAlchemy patterns**
   ```python
   result = await db.execute(select(Model).where(...))
   items = result.scalars().all()
   ```

2. **All routes require auth** unless explicitly public
   ```python
   current_user: User = Depends(get_current_user)
   ```

3. **Schema naming convention**
   - `<Model>Create` — POST body (required fields)
   - `<Model>Update` — PATCH body (all Optional)
   - `<Model>Read` — response (includes `id`, `from_attributes=True`)

4. **Router prefix pattern**
   - `/api/logframes/{logframe_id}/<plural>` for logframe-scoped resources
   - `/api/<plural>` for top-level resources (users, organisations)

5. **Never return SQLAlchemy objects directly** — always use `response_model`

6. **Migrations after every model change**
   ```bash
   cd backend
   alembic revision --autogenerate -m "describe change"
   alembic upgrade head
   ```

7. **Test every new router** — minimum: list, create, auth required

## Key Files to Read First
- `backend/app/routers/logframes.py` — reference router pattern
- `backend/app/models/logframe.py` — reference model (most complex)
- `backend/app/schemas/` — look at any existing schema for pattern
- `backend/tests/conftest.py` — test fixtures

## Open Work
See `backend/ISSUES.md` for prioritised feature backlog.
