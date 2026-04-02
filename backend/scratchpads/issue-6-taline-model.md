# Issue #6 — Add TALine model and CRUD endpoints

**Link**: https://github.com/glenhayoge/kashana-api/issues/6

## Context

TA Lines (Technical Assistance Lines) track technical assistance resources per activity.
Each activity can have multiple TA lines representing consultant/expert engagements.
The `band` field uses Low/Medium/High classification. The `type` field is a simple string
(keeping it simple rather than a separate TAType model for now).

## Requirements from issue

- Model: `TALine` with fields: id, activity_id, type, name, band (Low/Medium/High), start_date, end_date, no_days, amount
- Router: `/api/logframes/{id}/talines/`
- Date range filtering support
- Include in bootstrap data

## Implementation Plan

### Step 1: Add TALine model
- Add `TALine` class to `app/models/logframe.py`
- Table: `logframe_taline`
- Fields: id, activity_id (FK), type (String), name (String), band (String), start_date (Date, nullable), end_date (Date, nullable), no_days (Integer), amount (Float)
- Add relationship on Activity
- Export from `app/models/__init__.py`

### Step 2: Add Pydantic schemas
- TALineBase, TALineCreate, TALineUpdate, TALineRead

### Step 3: Add router
- `/api/logframes/{logframe_id}/talines/`
- GET list with optional `?activity={id}`, `?start_date=`, `?end_date=` filters
- POST create (201)
- PATCH update
- DELETE (204)

### Step 4: Wire into app (main.py)

### Step 5: Add to bootstrap

### Step 6: Add Alembic migration

### Step 7: Write tests

### Step 8: Run full test suite
