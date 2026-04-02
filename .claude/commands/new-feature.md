# /new-feature — Scaffold a complete full-stack feature

Implement a complete new feature end-to-end across the **Chauka monorepo** (FastAPI backend + React frontend).

## Usage
```
/new-feature <feature-name>
```
Example: `/new-feature actuals` or `/new-feature ta-lines`

## Steps to Follow

### 1. Clarify scope
- Ask the user what domain this feature belongs to (which logframe sub-resource)
- Check `backend/ISSUES.md` and `frontend/ISSUES.md` for the matching issue(s)
- Confirm the API shape: what endpoints are needed, what fields

### 2. Backend — Model
- Add SQLAlchemy model to `backend/app/models/<domain>.py`
- Register model in `backend/app/models/__init__.py` (import it)
- Follow existing model patterns: `id` (Integer PK), FK to logframe, timestamps if appropriate

### 3. Backend — Schemas
- Create `backend/app/schemas/<domain>.py` with:
  - `<Model>Base` (shared fields)
  - `<Model>Create(Base)`
  - `<Model>Update(Base)` (all fields Optional)
  - `<Model>Read(Base)` (includes `id`, `model_config = ConfigDict(from_attributes=True)`)

### 4. Backend — Router
- Create `backend/app/routers/<plural>.py`
- Use prefix `/api/logframes/{logframe_id}/<plural>`
- Implement: GET list, POST create, GET single, PATCH update, DELETE
- Add `Depends(get_current_user)` to all routes
- Register in `backend/app/main.py`: `app.include_router(<plural>_router)`

### 5. Backend — Migration
- Run: `cd backend && alembic revision --autogenerate -m "add <domain>"`
- Review the generated file in `backend/alembic/versions/`
- Run: `alembic upgrade head`

### 6. Backend — Tests
- Create `backend/tests/test_<domain>.py`
- Cover: create, read, update, delete, auth required (401 without token)

### 7. Frontend — API client
- Create `frontend/src/api/<domain>.ts`
- Export typed functions using axios, all returning the `Read` type

### 8. Frontend — Hook
- Create `frontend/src/hooks/use<Domain>.ts`
- Export `useQuery` hooks for reads and `useMutation` hooks for writes
- Invalidate query cache on successful mutations

### 9. Frontend — Component / Page
- Add/update the relevant page in `frontend/src/pages/`
- Wire in the hooks; show loading and error states
- Use existing TailwindCSS classes and component patterns

### 10. Verify
- `cd backend && pytest tests/test_<domain>.py -v`
- `cd frontend && npm run type-check`
