# /fix-issue — Implement an issue from ISSUES.md

Work an open issue from `backend/ISSUES.md` or `frontend/ISSUES.md`.

## Usage
```
/fix-issue backend#<N>
/fix-issue frontend#<N>
/fix-issue <N>       ← searches both files
```
Example: `/fix-issue backend#1` or `/fix-issue frontend#7`

## Steps

### 1. Read the issue
- Open `backend/ISSUES.md` or `frontend/ISSUES.md`
- Find the issue by number
- Read the full description: Tasks checklist and Acceptance criteria

### 2. Cross-reference paired issues
- Backend issues often pair with a frontend issue (check cross-references in both files)
- Note which phase the issue belongs to so you know what's expected to be done first

### 3. Plan the implementation
- List all files that need to be created or modified
- Identify any dependencies (does this issue require another issue to be done first?)
- Note the acceptance criteria — this is your definition of done

### 4. Implement
Follow the relevant command guide depending on what type of work this is:
- New API resource: see `/new-router` or `/new-feature`
- Migration needed: see `/new-migration`
- Frontend only: see `/new-component`

### 5. Test against acceptance criteria
Run the relevant tests:
```bash
# Backend
cd backend && pytest tests/ -v -k "<relevant_keyword>"

# Frontend
cd frontend && npm run type-check
```

### 6. Mark done in ISSUES.md
Add `✅` prefix to the issue title in the relevant ISSUES.md, e.g.:
```
### ✅ Issue #1: Add `rating` and `contribution_weighting` fields to Result model
```

## Priority Order

### Backend Phase 1 (highest priority first)
1. #1 rating + contribution_weighting on Result
2. #2 Activity fields (start_date, end_date, lead, deliverables)
3. #3 Levels config / bootstrap
4. #4 Ratings model
5. #5 Target model
6. #15 Actual model
7. #9 Users list endpoint
8. #6 TALine model
9. #7 StatusUpdate model
10. #8 Excel exports

### Frontend Phase 1 (highest priority first)
1. #1 Result hierarchy tree
2. #2 Rating badge
3. #3 Edit/Monitor buttons per result
4. #4 Activity rows in leaf results
5. #7 Result Design page
6. #8 Monitor page
7. #9 Save feedback states
8. #5 Filter bar
9. #10 Dashboard/nav
