# kashana-web — Feature Issues

Issues are ordered by priority. Each maps to a GitHub issue to create.

---

## Phase 1: Core UI Parity with Legacy App

### Issue #1: Implement result hierarchy with expand/collapse and level labels
**Labels:** `enhancement`, `priority:high`, `page:overview`

The Overview page must render results as a nested tree matching the original Kashana layout:
- Show level labels from a configurable map: `{1: "Impact (Goal)", 2: "Outcome", 3: "Output"}`
- Triangle toggle (▼/▶) for expand/collapse
- Auto-expand results at level ≤ `open_result_level` (default 2)
- Indent child results visually
- Sort results by `order` field within each parent group
- Show result description (HTML) below the name
- "Click to add title" placeholder for new results at the bottom

**Acceptance:** Overview page matches the screenshot layout with Impact/Outcome/Output hierarchy.

---

### Issue #2: Add rating badge (colored dot) to each result row
**Labels:** `enhancement`, `priority:high`, `page:overview`

Each result row shows a colored status dot (right side):
- Green = on track, Yellow/Amber = caution, Red = off track, Grey = not rated
- Clicking the dot opens a picker dialog with all available ratings
- Ratings come from `riskRatings` collection (per logframe)
- PATCH result with selected `rating` on change
- Display-only when `canEdit` is false

**Acceptance:** Colored dots appear on result rows. Clicking cycles through rating options.

---

### Issue #3: Add Edit and Monitor buttons per result row
**Labels:** `enhancement`, `priority:high`, `page:overview`

Each result row needs two action buttons:
- **Edit** → navigates to `/logframes/:id/design?result=:resultId`
- **Monitor** → navigates to `/logframes/:id/monitor?result=:resultId`
- Buttons render as small pill-style controls matching the original UI

**Acceptance:** Edit/Monitor buttons appear on each result row and navigate correctly.

---

### Issue #4: Implement activity rows within leaf results
**Labels:** `enhancement`, `priority:high`, `page:overview`

Leaf results (no children) should display their activities inline:
- Each activity shows as a collapsible row: name, lead person, date range, status badge
- Expanding reveals: description, deliverables, TA lines table, budget lines table, status history
- Activity name is inline-editable
- "Click to add" row at the bottom for new activities

**Acceptance:** Activities appear under leaf results with collapse/expand and all fields.

---

### Issue #5: Implement date range and lead person filter bar
**Labels:** `enhancement`, `priority:medium`, `page:overview`

Add filter controls above the result tree:
- Date from / Date to inputs (date picker)
- Lead person dropdown (populated from users endpoint — need new endpoint)
- Clear button to reset all filters
- Filtering logic: show activities whose date range overlaps the filter range
- A result is visible if it has at least one visible activity or visible child

**Acceptance:** Filters narrow visible activities; result tree collapses to show only matching branches.

---

### Issue #6: Implement export controls (quarterly report, annual plan, quarterly plan)
**Labels:** `enhancement`, `priority:medium`, `page:overview`

Add three export dropdowns at the bottom of the overview:
- **Export quarterly progress report:** dropdown of periods → downloads XLSX
- **Export Annual plan for year:** dropdown of years → downloads XLSX
- **Export Or plan for Quarter:** dropdown of quarter periods → downloads XLSX
- Each triggers a GET to the backend export endpoint with a `StreamingResponse`

Requires backend export endpoints (see kashana-api Issue #8).

**Acceptance:** Export dropdowns trigger file downloads.

---

### Issue #7: Implement full Result Design page (single result editor)
**Labels:** `enhancement`, `priority:high`, `page:design`

Redesign the Result Design page to edit a single result (routed via `?result=:id`):
- Editable fields: name, description (rich text), risk rating (select), contribution weighting (number)
- **Indicator section**: list of indicators with name, description, source of verification
  - Targets table per indicator: rows = subindicators, columns = milestones (periods)
  - Cells are editable target values (create-on-demand via POST)
  - Add indicator / add subindicator buttons
- **Assumptions section**: list of rich-text assumption descriptions with add/remove
- **Delete result** button with confirmation dialog

**Acceptance:** Full CRUD for result metadata, indicators with target grid, and assumptions.

---

### Issue #8: Implement full Monitor page (actuals entry)
**Labels:** `enhancement`, `priority:high`, `page:monitor`

Redesign the Monitor page to enter actuals for a single result:
- Per indicator table showing:
  - Baseline column (target value for first milestone — read-only)
  - Next milestone column (target for next future milestone — read-only)
  - Last 3 actual columns with editable date headers
  - Cells: actual value (editable), evidence (rich text, expandable)
- Rows = subindicators
- Create-on-demand: POST actual record on first edit
- Per-subindicator rating picker
- Add column button for new measurement dates

**Acceptance:** Users can enter actual values and evidence against indicator targets.

---

### Issue #9: Add save feedback states (in-progress, success, error)
**Labels:** `enhancement`, `priority:medium`, `ui`

All editable fields should show visual save feedback:
- Saving: subtle spinner or pulsing border (replaces `in-progress` CSS class)
- Success: brief green flash (auto-clears after 2s)
- Error: persistent red border with error message
- Uses React Query mutation states (`isPending`, `isSuccess`, `isError`)

**Acceptance:** All editable fields show save status visually.

---

### Issue #10: Implement dashboard page with logframe switcher
**Labels:** `enhancement`, `priority:medium`, `ui`

Replace the current logframe selection page with a proper dashboard:
- Top nav includes logframe switcher dropdown (when multiple logframes exist)
- Dashboard nav buttons matching original: "Dashboard", "People"
- User name display with logout button (already partially done)

**Acceptance:** Top navigation matches original Kashana MIS header.

---

## Phase 2: Activity Management

### Issue #11: Implement full ActivityContainer with TA lines
**Labels:** `enhancement`, `priority:medium`, `page:overview`

Full activity editing within leaf results:
- Activity fields: name, start_date, end_date, description, deliverables, lead (user select)
- **TA Lines table**: type (select), name, band (Low/Medium/High), start/end dates, days, amount
  - Footer with total TA amount
  - Add/remove TA line rows
- **Budget Lines table** (already partially implemented): name, amount
  - Footer with total budget

Requires backend TA lines support (see kashana-api Issue #6).

**Acceptance:** Full activity editing with TA lines, budget lines, and totals.

---

### Issue #12: Implement status updates for activities
**Labels:** `enhancement`, `priority:medium`, `page:overview`

Each activity has a status section:
- **Add status form**: date (defaults today), status code (select), description (rich text)
- **Status history**: collapsible table of past updates sorted by date
  - Columns: date, code name, user name, description (rendered HTML)
- POST new StatusUpdate on submit

Requires backend status update endpoints (see kashana-api Issue #7).

**Acceptance:** Users can add and view status updates per activity.

---

## Phase 3: Enhanced Features

### Issue #13: Add "Add result" functionality
**Labels:** `enhancement`, `priority:medium`, `page:overview`

- "Click to add title" row at the bottom of the result tree
- Creates a new result at the appropriate level
- Auto-assigns order and level using backend logic
- Supports adding child results to existing results

**Acceptance:** New results can be added inline from the overview page.

---

### Issue #14: Implement editable date fields with date picker
**Labels:** `enhancement`, `priority:low`, `ui`

Replace text-based date editing with proper date picker:
- Install `react-datepicker` or use native `<input type="date">`
- Display format: DD/MM/YYYY, API format: YYYY-MM-DD
- Linked date constraints (start_date ≤ end_date)

**Acceptance:** All date fields use date picker with proper formatting.

---

### Issue #15: Responsive design and mobile support
**Labels:** `enhancement`, `priority:low`, `ui`

- Kashana targets low-bandwidth environments and mobile devices
- Horizontal scroll for wide tables (monitor page, targets)
- Collapsible sidebar for mobile navigation
- Touch-friendly edit interactions

**Acceptance:** App is usable on tablet-sized screens.

---

### Issue #16: Implement People/Users management page
**Labels:** `enhancement`, `priority:low`, `page:people`

The original has a "People" button in the header:
- List users associated with the logframe
- Assign roles/permissions
- Used as lead person options in activity assignments

Requires backend users endpoint (see kashana-api Issue #10).

**Acceptance:** Users page accessible from header nav.

---

### Issue #17: KoboToolBox integration placeholder
**Labels:** `enhancement`, `priority:low`, `future`

Per the background document, Kashana aims to integrate with KoboToolBox for data collection:
- Design integration hooks for importing KoboToolBox form data
- Map KoboToolBox submissions to indicator actuals
- This is a future feature — create the architectural foundation only

**Acceptance:** Design document and API contract for KoboToolBox integration.

---

### Issue #18: Financial tracking module
**Labels:** `enhancement`, `priority:low`, `future`

Per background document — future feature for budget tracking:
- Money divided between logframe elements and responsible people
- Track spending against budget per activity
- Budget utilization reports

**Acceptance:** Design document for financial tracking feature.
