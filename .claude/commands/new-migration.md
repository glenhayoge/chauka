# /new-migration — Create and apply an Alembic database migration

Use this command whenever you have changed SQLAlchemy models and need to update the database schema.

## Usage
```
/new-migration <short-description>
```
Example: `/new-migration add-actuals-table` or `/new-migration add-rating-to-result`

## Steps

### 1. Make sure models are imported
Confirm the model is imported in `backend/app/models/__init__.py` so Alembic can detect it.

### 2. Autogenerate the revision
```bash
cd backend
alembic revision --autogenerate -m "<short-description>"
```

### 3. Review the generated file
Open `backend/alembic/versions/<timestamp>_<description>.py` and verify:
- Tables/columns being created look correct
- No unintended `drop_table` or `drop_column` operations
- Nullable/non-nullable constraints are as intended

### 4. Apply migration
```bash
alembic upgrade head
```

### 5. Verify
```bash
alembic current    # should show head
alembic history    # shows migration chain
```

## Important Notes

- Always run alembic from the `backend/` directory
- `alembic.ini`'s `sqlalchemy.url` is a placeholder — set `CHAUKA_DATABASE_URL` in `.env.local` or environment
- For production on Fly.io, run migrations via: `fly ssh console -C "cd /app/backend && alembic upgrade head"`
- Never edit migration files after they've been applied to production — create a new revision instead

## Common Scenarios

### Add a column
Just add the field to the SQLAlchemy model, then run the command.

### Rename a column
Alembic autogenerate sees this as drop+add. Manually edit the migration to use `op.alter_column()` instead.

### Add an index
Use `mapped_column(index=True)` in the model — Alembic will detect it.
