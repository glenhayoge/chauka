# Chauka

A logframe management platform for monitoring and evaluation teams in development organisations. Chauka is a modern rewrite of the [Kashana MIS](https://github.com/aptivate/kashana) (originally built with Django and Backbone.js) using a React frontend and FastAPI backend.

---

## Overview

Chauka enables teams to design, monitor and report on logframes — the results frameworks used to track progress against development goals. The platform supports hierarchical result trees (Impact / Outcome / Output), indicator tracking, activity management, budget tracking, and Excel report exports.

---

## Tech Stack

**Backend**
- Python 3.12, FastAPI 0.111+
- SQLAlchemy 2.0 (async), asyncpg, PostgreSQL
- Alembic (migrations), Pydantic v2
- JWT authentication (python-jose, passlib/bcrypt)
- openpyxl (Excel exports), uvicorn

**Frontend**
- React 18, TypeScript 5, Vite 5
- React Router v6, TanStack React Query v5, Zustand
- Axios, TailwindCSS v3, Tiptap (rich text)

**Infrastructure**
- Docker (multi-stage, single-image deploy)
- Fly.io (primary hosting, `jnb` region)
- PostgreSQL (unmanaged cluster on Fly.io)

---

## Repository Structure

```
chauka/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py       # App factory, router registration
│   │   ├── config.py     # Settings (env prefix: CHAUKA_)
│   │   ├── database.py   # Async engine and session
│   │   ├── auth/         # JWT auth
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── routers/      # API route handlers
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── security/     # Middleware, IDOR, rate limiting
│   │   └── services/     # Business logic, exports
│   ├── alembic/          # Database migrations
│   ├── tests/            # pytest test suite
│   └── pyproject.toml
├── frontend/             # React application
│   ├── src/
│   │   ├── api/          # Axios API clients
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # React Query hooks
│   │   ├── pages/        # Route-level pages
│   │   ├── store/        # Zustand global state
│   │   └── utils/
│   └── package.json
├── deploy/               # Secondary Fly.io configs (separate apps)
│   ├── fly.api.toml      # Backend-only deploy
│   └── fly.web.toml      # Frontend-only deploy
├── Dockerfile            # Multi-stage: Node build + Python runtime
├── docker-compose.yml    # Local development stack
└── fly.toml              # Primary single-image Fly.io deploy
```

---

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 22
- Python 3.12
- `flyctl` (for deploys)

### Using Docker Compose (recommended)

Starts PostgreSQL, the FastAPI API, and the Vite dev server:

```bash
docker compose up --build
```

- API: http://localhost:8000
- Frontend dev server: http://localhost:5173
- API docs: http://localhost:8000/docs

### Manual Setup

**Backend**
```bash
cd backend
pip install -e .
cp .env.local.example .env.local   # edit with your DB credentials
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

All variables use the `CHAUKA_` prefix. Set them in `backend/.env.local` for local development.

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAUKA_DATABASE_URL` | PostgreSQL asyncpg URL | `postgresql+asyncpg://postgres:postgres@localhost:5432/chauka` |
| `CHAUKA_SECRET_KEY` | JWT signing secret | `dev-secret-key-change-in-production` |
| `CHAUKA_CORS_ORIGINS` | JSON list of allowed origins | `["http://localhost:5173"]` |
| `CHAUKA_ENVIRONMENT` | `development` or `production` | `development` |
| `CHAUKA_ACCESS_TOKEN_EXPIRE_MINUTES` | JWT TTL | `480` |

---

## Database Migrations

Always run Alembic from the `backend/` directory:

```bash
cd backend

# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing models
alembic revision --autogenerate -m "describe your change"

# Check current state
alembic current
```

---

## Deploying to Fly.io

The primary deploy strategy is a single Docker image where FastAPI serves the built React static files.

### First-time setup

1. Create a Fly app (if not already):
   ```bash
   fly apps create chauka
   ```

2. Provision a Postgres cluster on Fly.io and note the connection string.

3. Set secrets:
   ```bash
   fly secrets set \
     CHAUKA_DATABASE_URL="postgresql+asyncpg://<user>:<pass>@<host>:5432/<db>" \
     CHAUKA_SECRET_KEY="$(openssl rand -hex 32)" \
     CHAUKA_CORS_ORIGINS='["https://chauka.fly.dev"]'
   ```

### Deploy

```bash
fly deploy
```

### Run migrations after deploy

```bash
fly ssh console -C "cd /app/backend && alembic upgrade head"
```

### Verify

```bash
curl https://chauka.fly.dev/health
```

### Logs

```bash
fly logs --follow
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=term-missing
```

```bash
cd frontend
npm run type-check
npm run lint
```

---

## Claude Code Integration

A `.claude/` configuration directory is excluded from version control but can be recreated locally. It provides:

- `CLAUDE.md` — full project context loaded automatically by Claude Code
- `commands/` — slash commands: `/new-feature`, `/new-router`, `/new-migration`, `/new-component`, `/fix-issue`, `/run-tests`, `/deploy`
- `agents/` — specialist agent contexts for backend and frontend work

---

## Feature Backlog

Open issues are tracked in:
- `backend/ISSUES.md` — API features and hardening (15 issues)
- `frontend/ISSUES.md` — UI features and design parity (18 issues)

Issues are ordered by priority within each phase.

---

## Credits

Chauka is built on the concepts and original design of [Kashana MIS](https://github.com/aptivate/kashana), developed by [Aptivate](http://www.aptivate.org). The logframe data model, terminology, and core workflow are derived from their work.

Chauka is developed by **Glen Hayoge**.

## License

MIT
