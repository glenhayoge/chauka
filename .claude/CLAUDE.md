# Chauka — Claude Code Context

Chauka is a **logframe management platform** (monitoring & evaluation tool for development organisations).
It is a port of the legacy Django/Backbone "Kashana" application to a modern React + FastAPI stack.

## Monorepo Structure

```
chauka/
├── backend/          # FastAPI + SQLAlchemy + asyncpg + Alembic
│   ├── app/
│   │   ├── main.py         # App factory, router registration, static file serving
│   │   ├── config.py       # Settings (env prefix: CHAUKA_)
│   │   ├── database.py     # Async engine, session factory, Base
│   │   ├── auth/           # JWT auth router + dependencies
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── routers/        # FastAPI routers (one file per domain)
│   │   ├── schemas/        # Pydantic v2 schemas (request/response)
│   │   ├── security/       # Middleware, IDOR helpers, rate limiting
│   │   └── services/       # Business logic (export, etc.)
│   ├── alembic/            # DB migrations
│   ├── alembic.ini         # Points to CHAUKA_DATABASE_URL
│   ├── tests/              # pytest + pytest-asyncio
│   └── pyproject.toml      # Build: hatchling; deps: fastapi, sqlalchemy, asyncpg
├── frontend/         # React 18 + TypeScript + Vite + TailwindCSS
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/            # Axios API clients
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # React Query + custom hooks
│   │   ├── pages/          # Route-level page components
│   │   ├── store/          # Zustand global state
│   │   └── utils/          # Helpers, formatters
│   ├── package.json        # deps: react, react-router-dom, @tanstack/react-query, zustand, axios
│   └── vite.config.ts      # Dev proxy: /api → http://localhost:8000
├── Dockerfile              # Multi-stage: Node build → Python runtime (single image)
├── fly.toml                # Primary Fly.io deploy config (single-image)
├── docker-compose.yml      # Local dev: postgres + api + vite dev server
└── deploy/
    ├── fly.api.toml        # Secondary: backend-only Fly app (chauka-api)
    └── fly.web.toml        # Secondary: frontend-only Fly app (chauka-web)
```

## Tech Stack

### Backend
| Concern | Library |
|---------|---------|
| Framework | FastAPI 0.111+ |
| ORM | SQLAlchemy 2.0 async |
| DB driver | asyncpg (PostgreSQL) |
| Migrations | Alembic |
| Auth | JWT via python-jose |
| Validation | Pydantic v2 |
| Password hashing | passlib/bcrypt |
| HTTP client | httpx |
| Spreadsheet export | openpyxl |
| Runtime | uvicorn[standard] |

### Frontend
| Concern | Library |
|---------|---------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build | Vite 5 |
| Routing | react-router-dom v6 |
| Server state | @tanstack/react-query v5 |
| Client state | zustand v4 |
| HTTP | axios |
| Rich text | @tiptap/react |
| Styling | TailwindCSS v3 |

## Environment Variables (all prefixed `CHAUKA_`)

| Variable | Description |
|----------|-------------|
| `CHAUKA_DATABASE_URL` | PostgreSQL asyncpg URL: `postgresql+asyncpg://user:pass@host:5432/db` |
| `CHAUKA_SECRET_KEY` | JWT signing secret (use `openssl rand -hex 32`) |
| `CHAUKA_CORS_ORIGINS` | JSON list of allowed origins, e.g. `'["https://chauka.fly.dev"]'` |
| `CHAUKA_ENVIRONMENT` | `development` or `production` |
| `CHAUKA_ACCESS_TOKEN_EXPIRE_MINUTES` | JWT TTL, default 480 |

Local dev uses `.env.local` in `backend/` — pydantic-settings reads it automatically.

## Common Dev Commands

### Backend
```bash
cd backend
# Install (editable)
pip install -e .

# Run dev server (hot-reload)
uvicorn app.main:app --reload

# Run tests
pytest tests/ -v

# New migration (after changing models)
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Vite dev server on :5173 (proxies /api to :8000)
npm run build     # Production build → dist/
npm run type-check
```

### Docker (local full stack)
```bash
# From project root
docker compose up --build   # postgres + api + vite dev server
```

### Fly.io Deploy
```bash
# From project root
fly deploy   # builds Dockerfile, deploys to fly.toml app
```

## File Naming Conventions

### Backend
- Models: `backend/app/models/<domain>.py` — SQLAlchemy classes, named singular (`Result`, `Indicator`)
- Schemas: `backend/app/schemas/<domain>.py` — Pydantic models: `<Model>Create`, `<Model>Update`, `<Model>Read`
- Routers: `backend/app/routers/<plural>.py` — APIRouter, prefix `/api/logframes/{logframe_id}/<plural>`
- Tests: `backend/tests/test_<domain>.py`

### Frontend
- Pages: `frontend/src/pages/<PageName>.tsx`
- Components: `frontend/src/components/<ComponentName>.tsx`
- Hooks: `frontend/src/hooks/use<Domain>.ts`
- API clients: `frontend/src/api/<domain>.ts`

## Key Patterns

### FastAPI router pattern
```python
router = APIRouter(prefix="/api/logframes/{logframe_id}/things", tags=["things"])

@router.get("/", response_model=list[ThingRead])
async def list_things(logframe_id: int, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    ...
```

### SQLAlchemy async query pattern
```python
result = await db.execute(select(Thing).where(Thing.logframe_id == logframe_id))
return result.scalars().all()
```

### React Query + axios pattern
```typescript
// frontend/src/api/things.ts
export const getThings = (logframeId: number) =>
  axios.get<Thing[]>(`/api/logframes/${logframeId}/things`).then(r => r.data)

// frontend/src/hooks/useThings.ts
export const useThings = (logframeId: number) =>
  useQuery({ queryKey: ['things', logframeId], queryFn: () => getThings(logframeId) })
```

## Open Issues

Backend issues are tracked in `backend/ISSUES.md`.
Frontend issues are tracked in `frontend/ISSUES.md`.

Both are ordered by priority. When implementing an issue, cross-reference both files — many backend and frontend issues are paired.

## Alembic Note

`alembic.ini` `sqlalchemy.url` is overridden at runtime by `CHAUKA_DATABASE_URL`.
Always run alembic from the `backend/` directory.
