# kashana-api — Feature Issues

Issues are ordered by priority. Each maps to a GitHub issue to create.

---

## Phase 1: Core API Completeness

### Issue #1: Add `rating` and `contribution_weighting` fields to Result model
**Labels:** `enhancement`, `priority:high`, `model`

The legacy app has fields on Result not yet in our model:
- `rating` — FK to a Rating/RiskRating, displayed as colored dot on overview
- `contribution_weighting` — integer (default 100), used in design page

Tasks:
- Add `rating_id` (nullable FK to `logframe_riskrating`) to `Result` model
- Add `contribution_weighting` (Integer, default=100) to `Result` model
- Update `ResultRead`, `ResultUpdate` schemas to include both fields
- Create Alembic migration

**Acceptance:** PATCH `/api/logframes/{id}/results/{id}` accepts `rating_id` and `contribution_weighting`.

---

### Issue #2: Add `start_date`, `end_date`, `lead`, and `deliverables` fields to Activity model
**Labels:** `enhancement`, `priority:high`, `model`

The legacy Activity model has fields not yet ported:
- `start_date` — Date (nullable)
- `end_date` — Date (nullable)
- `lead` — FK to User (nullable), the person responsible
- `deliverables` — Text (rich text, default "")

Tasks:
- Add fields to `Activity` SQLAlchemy model
- Update `ActivityCreate`, `ActivityUpdate`, `ActivityRead` schemas
- Create Alembic migration
- Add date overlap filter support to `GET /activities/` endpoint (`?start_date=&end_date=`)

**Acceptance:** Activity CRUD supports all fields; date range filtering works.

---

### Issue #3: Add Levels configuration to bootstrap data
**Labels:** `enhancement`, `priority:high`, `api`

The frontend needs a level → label map: `{1: "Impact (Goal)", 2: "Outcome", 3: "Output"}`.

Options:
- Add a `Level` model (id, name, logframe_id) or
- Return levels as a computed dict from `AppSettings.max_result_level` in bootstrap

Tasks:
- Add `max_result_level` and `open_result_level` fields to `Settings` model
- Include `levels` dict and `conf` object in bootstrap response
- Default: `{1: "Impact (Goal)", 2: "Outcome", 3: "Output"}`

**Acceptance:** Bootstrap endpoint returns `levels` and `conf` objects.

---

### Issue #4: Add Ratings model and endpoint
**Labels:** `enhancement`, `priority:high`, `model`

The legacy app has a `Rating` model (distinct from `RiskRating`):
- `id`, `name`, `color` (hex color string), `logframe_id`
- Used for the colored status dots on overview page results

Tasks:
- Create `Rating` model: id, name, color (String), logframe_id
- Add CRUD router at `/api/logframes/{id}/ratings/`
- Include ratings in bootstrap response
- Seed demo data with: On Track (green), Caution (amber), Off Track (red), Not Rated (grey)

**Acceptance:** Ratings CRUD works; bootstrap includes ratings with colors.

---

### Issue #5: Add Target model and CRUD endpoints
**Labels:** `enhancement`, `priority:high`, `model`

Targets store expected values per (subindicator, milestone/period):
- `id`, `indicator_id`, `subindicator_id`, `milestone_id` (FK to Period), `value` (String)

Tasks:
- Create `Target` model
- Add router at `/api/logframes/{id}/targets/`
- Support query params: `?subindicator={id}`, `?milestone={id}`
- Create-on-demand: POST creates, PUT/PATCH updates

**Acceptance:** Targets CRUD works; design page can save target values per cell.

---

### Issue #6: Add TALine (Technical Assistance) model and CRUD endpoints
**Labels:** `enhancement`, `priority:medium`, `model`

TA Lines track technical assistance resources per activity:
- `id`, `activity_id`, `type` (FK or string), `name`, `band` (Low/Medium/High), `start_date`, `end_date`, `no_days` (integer), `amount` (float)

Tasks:
- Create `TALine` model with `__tablename__ = "logframe_taline"`
- Create `TAType` model if needed
- Add router at `/api/logframes/{id}/talines/`
- Support date range filtering
- Include in bootstrap data

**Acceptance:** TA lines CRUD works; activity container can display and edit TA lines.

---

### Issue #7: Add StatusUpdate model and CRUD endpoints
**Labels:** `enhancement`, `priority:medium`, `model`

Status updates track activity progress over time:
- `id`, `activity_id`, `user_id` (auto-set from auth), `code` (FK to StatusCode), `date`, `description` (rich text)

Tasks:
- Create `StatusUpdate` model
- Add router at `/api/logframes/{id}/statusupdates/`
- Auto-set `user_id` from `current_user` on POST
- Support date range filtering
- Return user name in response for display

**Acceptance:** Status updates CRUD works; activities show status history.

---

### Issue #8: Implement Excel export endpoints
**Labels:** `enhancement`, `priority:medium`, `api`

Port the 3 Django export views to FastAPI:
- `GET /api/logframes/{id}/export/quarterly-report/?period=MM-YYYY` → XLSX
- `GET /api/logframes/{id}/export/annual-plan/?year=YYYY` → XLSX
- `GET /api/logframes/{id}/export/quarterly-plan/?period=MM-YYYY` → XLSX

Tasks:
- Create `app/services/export.py` with openpyxl workbook builders
- Create `app/routers/export.py` with StreamingResponse
- Match column layout from legacy Django export views
- Add auth (require login)

**Acceptance:** Export endpoints return valid XLSX files.

---

### Issue #9: Add Users list endpoint
**Labels:** `enhancement`, `priority:medium`, `api`

Frontend needs a list of users for:
- Lead person dropdown on activities
- "People" page
- Status update user display

Tasks:
- Add `GET /api/users/` endpoint (list active users, basic fields only: id, username, first_name, last_name)
- Require authentication
- Include in bootstrap response as `users` array

**Acceptance:** Users endpoint returns list; bootstrap includes users.

---

### Issue #10: Add input sanitization middleware for rich text fields
**Labels:** `enhancement`, `priority:medium`, `security`

All description/rich text fields should be sanitized on write:
- Wire `sanitize_html()` into PATCH/POST handlers for: Result.description, Activity.description, Activity.deliverables, Assumption.description, StatusUpdate.description
- Consider adding as Pydantic validator or middleware

**Acceptance:** Script tags and event handlers are stripped from all stored HTML.

---

## Phase 2: API Hardening

### Issue #11: Wire IDOR ownership verification into all nested routers
**Labels:** `enhancement`, `priority:high`, `security`

`app/security/ownership.py` has helpers but they're not wired in:
- Add `verify_result_ownership` to all result-nested routes (indicators, activities, assumptions, budget)
- Add `verify_indicator_ownership` to indicator-nested routes (subindicators)
- Add `verify_activity_ownership` to activity-nested routes (budget lines, milestones)

**Acceptance:** Accessing resources across logframes returns 404.

---

### Issue #12: Wire rate limiting into auth endpoint
**Labels:** `enhancement`, `priority:high`, `security`

`app/security/rate_limit.py` exists but is not connected:
- Add `check_auth_rate_limit` as a dependency on `POST /api/auth/token`
- Return 429 after 5 failed attempts per minute per IP

**Acceptance:** Brute force login attempts are rate-limited.

---

### Issue #13: Add Alembic migration for existing database
**Labels:** `enhancement`, `priority:medium`, `infra`

For production with existing MySQL database:
- Generate initial migration matching existing Django table schema
- Mark as "stamped" (no actual migration needed for existing DB)
- Future migrations handled normally

Tasks:
- `alembic revision --autogenerate -m "initial schema"`
- Test with both SQLite (dev) and MySQL (production)

**Acceptance:** Alembic can manage schema changes going forward.

---

### Issue #14: Add comprehensive API tests
**Labels:** `enhancement`, `priority:medium`, `testing`

Current tests only cover health and auth:
- Add tests for full CRUD cycle: results, indicators, subindicators, activities
- Add tests for bootstrap endpoint data shape
- Add tests for permission enforcement (read-only vs editor)
- Add tests for IDOR prevention
- Use pytest fixtures with in-memory SQLite

**Acceptance:** >80% endpoint coverage with passing tests.

---

### Issue #15: Add Actual model and CRUD endpoints
**Labels:** `enhancement`, `priority:high`, `model`

Actuals store measured values for the monitor page:
- `id`, `indicator_id`, `subindicator_id`, `column_id`, `value` (String), `evidence` (Text/HTML)

Tasks:
- Create `Actual` model (table: `logframe_actual`)
- Add router at `/api/logframes/{id}/actuals/`
- Support query params: `?subindicator={id}`, `?column={id}`
- Create-on-demand pattern (POST if no record, PATCH if exists)

**Acceptance:** Monitor page can save actual values and evidence.
