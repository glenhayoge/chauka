# Issue #5 — Add Target model and CRUD endpoints

**Link**: https://github.com/glenhayoge/kashana-api/issues/5

## Context

Targets store expected values per (subindicator, milestone/period) pair for the Monitor page.
This is analogous to `DataEntry` (which stores actual values per subindicator/column) but
maps subindicators to periods instead of columns.

The issue references `milestone_id` as FK to Period — this matches the legacy Django design
where "milestone" in the target context meant a time period, not the Activity-Milestone junction.

## Requirements from issue

- Model: `Target` with fields: id, indicator_id, subindicator_id, milestone_id (FK Period), value (String)
- Router: `/api/logframes/{id}/targets/`
- Query params: `?subindicator={id}`, `?milestone={id}`
- Create-on-demand: POST creates, PATCH updates

## Implementation Plan

### Step 1: Add Target model
- Add `Target` class to `app/models/logframe.py`
- Table: `logframe_target`
- Fields: id (PK), indicator_id (FK Indicator), subindicator_id (FK SubIndicator), milestone_id (FK Period), value (String, nullable)
- Add relationships on SubIndicator and Period
- Export from `app/models/__init__.py`

### Step 2: Add Pydantic schemas
- Add TargetBase, TargetCreate, TargetUpdate, TargetRead to `app/schemas/logframe.py`

### Step 3: Add router
- Create `app/routers/targets.py`
- GET `/` — list targets, optional `?subindicator={id}` and `?milestone={id}` filters
- POST `/` — create target (201)
- PATCH `/{target_id}` — update target value
- DELETE `/{target_id}` — delete target (204)
- Auth: read requires `get_current_user`, write requires `require_editor`

### Step 4: Wire into app
- Import and include router in `app/main.py`

### Step 5: Add to bootstrap
- Include targets in `app/services/bootstrap.py`
- Add "targets" key to bootstrap response

### Step 6: Add Alembic migration
- Create migration for `logframe_target` table

### Step 7: Write tests
- Schema validation tests
- Model persistence tests (in-memory SQLite)
- CRUD integration tests via bootstrap
- Query filter tests

### Step 8: Verify
- Run full test suite, ensure no regressions
