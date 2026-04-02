# Issue #2: Add Rating Badge (Colored Dot) to Each Result Row

**Issue**: https://github.com/glenhayoge/kashana-web/issues/2
**Status**: In Progress
**Date**: 2026-03-27

## Problem

Each result row needs a colored status dot on the right side indicating progress status. Users should be able to click the dot to change the rating via a picker dialog.

## Requirements

- Green = on track, Yellow/Amber = caution, Red = off track, Grey = not rated
- Clicking the dot opens a picker dialog with all available ratings
- Ratings come from a new `ratings` collection (per logframe) with color field
- PATCH result with selected `rating_id` on change
- Display-only when `canEdit` is false

## Dependencies

- **kashana-api issue #4**: Rating model with color field needs to be created
- Result model needs a `rating_id` FK added

## Analysis

### Backend (kashana-api) - Must Be Done First

The backend currently has `RiskRating` (used for assumptions) but NOT a `Rating` model with a `color` field. The `Result` model has no `rating_id` field.

**Changes needed:**
1. **New `Rating` model** in `app/models/logframe.py`:
   - `id`, `name`, `color` (hex string), `logframe_id`
   - Relationship to Result (one-to-many)

2. **Add `rating_id` to `Result` model**:
   - Nullable FK to Rating
   - Relationship back_populates

3. **Schemas** in `app/schemas/logframe.py`:
   - `RatingBase`, `RatingCreate`, `RatingRead`, `RatingUpdate`
   - Add `rating_id` to `ResultBase`, `ResultUpdate`, `ResultRead`

4. **Router** at `/api/logframes/{logframe_id}/ratings/`:
   - GET list, POST create

5. **Bootstrap** in `app/services/bootstrap.py`:
   - Fetch ratings, include as `ratings` in response

6. **Demo seed data** in `scripts/create_demo_user.py`:
   - "On Track" (#16a34a), "Caution" (#f59e0b), "Off Track" (#dc2626), "Not Rated" (#9ca3af)

### Frontend (kashana-web)

1. **Types** in `src/api/types.ts`:
   - Add `Rating` interface with `id`, `name`, `color`, `logframe_id`
   - Add `rating_id: number | null` to `Result`
   - Add `ratings: Rating[]` to `BootstrapData`

2. **RatingBadge component** in `src/components/ui/RatingBadge.tsx`:
   - Renders a colored dot using the rating's hex color
   - Shows grey dot when no rating assigned
   - On click (when editable), shows a dropdown/popover with all ratings
   - Calls onSave with selected rating_id

3. **ResultRow integration** in `src/components/overview/ResultRow.tsx`:
   - Add RatingBadge to the right side of the result header row
   - Wire up PATCH call to save rating_id changes

## Implementation Order

1. Backend: Rating model + rating_id on Result
2. Backend: Schemas + router + bootstrap + seed
3. Frontend: Types update
4. Frontend: RatingBadge component
5. Frontend: ResultRow integration
6. Test everything
7. Open PRs
