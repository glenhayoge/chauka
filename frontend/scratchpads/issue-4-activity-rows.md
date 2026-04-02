# Issue #4: Implement Activity Rows Within Leaf Results

**Frontend Issue**: https://github.com/glenhayoge/kashana-web/issues/4
**Backend Issue**: https://github.com/glenhayoge/kashana-api/issues/2
**Status**: In Progress
**Date**: 2026-03-27

## Problem

Leaf results (no children) should display their activities inline with expand/collapse. The Activity model currently lacks fields needed for the full UI: start_date, end_date, lead (FK to User), and deliverables.

## Requirements

### Backend (kashana-api #2)
- Add `start_date` (Date, nullable), `end_date` (Date, nullable), `lead_id` (FK to User, nullable), `deliverables` (Text, default "") to Activity model
- Update ActivityCreate, ActivityUpdate, ActivityRead schemas
- Create Alembic migration
- Add date overlap filter to GET /activities/ endpoint (?start_date=&end_date=)

### Frontend (kashana-web #4)
- Each activity shows as a collapsible row: name, lead person, date range, status badge
- Expanding reveals: description, deliverables, TA lines table, budget lines table, status history
- Activity name is inline-editable
- "Click to add activity" row at bottom for new activities

## Analysis

### Current Backend State
- `Activity` model has: id, name, description, order, result_id
- `ActivityBase/Create/Update/Read` schemas match model
- Activities router at `/api/logframes/{logframe_id}/results/{result_id}/activities/`
- Standard CRUD with `get_current_user` (reads), `require_editor` (writes)
- Bootstrap service returns activities via `_row()` serialization

### Current Frontend State
- `Activity` type: id, name, description, order, result_id
- `ActivityContainer` component: basic display with editable name, milestones, budget lines
- `ResultRow` renders activities for leaf results (children.length === 0)
- Activities shown inline inside expanded result with Activity label badge
- No collapse/expand for individual activities
- No lead person, date range, or status display

### Dependencies
- Users list needed for lead person dropdown (future, use id for now)
- TA lines model needed for full expanded view (future, placeholder for now)
- Status updates model needed for status history (future, placeholder for now)

## Implementation Plan

### Phase 1: Backend Changes (kashana-api)

1. **Model** (`app/models/logframe.py`):
   - Add `start_date`, `end_date` (Date, nullable)
   - Add `lead_id` (FK to contacts_user, nullable)
   - Add `deliverables` (Text, default "")
   - Add `lead` relationship

2. **Schemas** (`app/schemas/logframe.py`):
   - Update ActivityBase: add start_date, end_date, lead_id, deliverables
   - Update ActivityCreate: inherits from updated base
   - Update ActivityUpdate: add optional fields
   - Update ActivityRead: inherits from updated base

3. **Router** (`app/routers/activities.py`):
   - Add optional `start_date` and `end_date` query params to list_activities
   - Filter activities whose date range overlaps the query range

4. **Bootstrap** (`app/services/bootstrap.py`):
   - No changes needed -- `_row()` serializes all columns automatically

5. **Migration**: Generate with Alembic

6. **Tests**: Test new fields in CRUD and date filtering

### Phase 2: Frontend Changes (kashana-web)

1. **Types** (`src/api/types.ts`):
   - Add start_date, end_date, lead_id, deliverables to Activity interface

2. **UI Store** (`src/store/ui.ts`):
   - Add expandedActivities Set<number> with toggle

3. **ActivityRow** component (new: `src/components/activity/ActivityRow.tsx`):
   - Collapsible row showing: name (inline-editable), lead name, date range, status badge
   - Expanded panel: description, deliverables, budget lines, placeholders for TA lines and status history

4. **ActivityContainer** (`src/components/activity/ActivityContainer.tsx`):
   - Refactor to be the expanded detail panel (description, deliverables, budget, etc.)

5. **ResultRow** (`src/components/overview/ResultRow.tsx`):
   - Replace inline activity rendering with ActivityRow component
   - Add "Click to add activity" row at bottom

6. **AddButton** usage for "Click to add activity"
