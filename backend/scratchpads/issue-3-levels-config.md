# Issue #3: Add Levels configuration to bootstrap data

## Context
The legacy Django app has a `ResultLevelName` model (unique_together on level_number + logframe) and `AppConf` with `max_result_level` (default 4) and `open_result_level` (default 2). The bootstrap response includes:
- `levels`: dict like `{1: "Impact", 2: "Outcome", 3: "Output"}` built from ResultLevelName rows
- `conf`: object with `max_result_level` and `open_result_level` from AppConf

For the FastAPI migration, we simplify: instead of a separate ResultLevelName table, we compute default level labels and add `max_result_level` + `open_result_level` to the Settings model.

## Plan

### Backend tasks (kashana-api)
1. Add `max_result_level` (int, default=3) and `open_result_level` (int, default=0) columns to Settings model in `app/models/appconf.py`
2. Update `SettingsRead` and `SettingsUpdate` schemas in `app/schemas/logframe.py`
3. Create Alembic migration with `op.add_column()` (SQLite compatible)
4. In `app/services/bootstrap.py`:
   - Compute `levels` dict from settings.max_result_level (default labels: {1: "Impact (Goal)", 2: "Outcome", 3: "Output"})
   - Build `conf` object with `max_result_level` and `open_result_level`
   - Add both to bootstrap response
5. Update `app/schemas/bootstrap.py` to include `levels` and `conf` fields
6. Write tests for schema, model, and bootstrap levels computation

### Frontend tasks (kashana-web)
1. Add `levels` (Record<number, string>) and `conf` ({max_result_level: number, open_result_level: number}) to BootstrapData in `src/api/types.ts`
2. Update `ResultRow.tsx` to use `data.levels` instead of hardcoded `LEVEL_LABELS`
3. Update `OverviewPage.tsx` to use `data.conf.open_result_level` instead of `DEFAULT_OPEN_LEVEL`

## Default level labels
```
{1: "Impact (Goal)", 2: "Outcome", 3: "Output"}
```
For max_result_level > 3, levels 4+ get label "Level N".
