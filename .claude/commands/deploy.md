# /deploy — Deploy to Fly.io

Deploy the Chauka app to Fly.io using the unified single-image strategy.

## Usage
```
/deploy           ← production deploy
/deploy --dry-run ← build only, don't push
```

## Pre-deploy Checklist

### 1. Secrets set?
```bash
fly secrets list
# Must include: CHAUKA_DATABASE_URL, CHAUKA_SECRET_KEY, CHAUKA_CORS_ORIGINS
```

If not set:
```bash
fly secrets set \
  CHAUKA_DATABASE_URL="postgresql+asyncpg://<user>:<pass>@<host>:5432/<db>" \
  CHAUKA_SECRET_KEY="$(openssl rand -hex 32)" \
  CHAUKA_CORS_ORIGINS='["https://chauka.fly.dev"]'
```

### 2. Migrations up to date?
```bash
fly ssh console -C "cd /app/backend && alembic upgrade head"
```
(Run this after deploy if there are pending migrations)

### 3. TypeScript clean?
```bash
cd frontend && npm run type-check
```

## Deploy
```bash
cd /Users/macbookpro/projects/chauka
fly deploy
```

This will:
1. Build Stage 1: `npm ci && npm run build` (React → `frontend/dist/`)
2. Build Stage 2: `pip install ./backend` + copy built assets
3. Push image to Fly registry
4. Create/update the machine in `jnb` region
5. Health check on `/health` before marking live

## Post-deploy Verification
```bash
curl https://chauka.fly.dev/health          # {"status":"ok"}
curl -I https://chauka.fly.dev/             # 200 + index.html
```

## Rollback
```bash
fly releases list            # list recent deployments
fly deploy --image <image>   # deploy a specific previous image
```

## Logs
```bash
fly logs -n 50     # last 50 lines
fly logs --follow  # stream live
```
