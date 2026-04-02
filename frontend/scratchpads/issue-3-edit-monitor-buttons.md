# Issue #3: Add Edit and Monitor Buttons Per Result Row

**Issue**: https://github.com/glenhayoge/kashana-web/issues/3
**Status**: In Progress
**Date**: 2026-03-27

## Problem

Each result row in the overview needs two action buttons (Edit and Monitor) that navigate to the per-result design and monitor pages.

## Requirements

- **Edit** button navigates to `/logframes/:id/design?result=:resultId`
- **Monitor** button navigates to `/logframes/:id/monitor?result=:resultId`
- Buttons render as small pill-style controls
- Placed alongside the existing RatingBadge on the right side of each result row

## Analysis

### Current State
- `ResultRow` has: toggle, level label, editable name, description, RatingBadge
- `ResultDesignPage` shows ALL results — no query param filtering
- `MonitorPage` shows ALL results — no query param filtering
- No `useSearchParams` usage anywhere in the app currently

### Implementation Plan

1. **ResultRow.tsx** — Add two `Link` pill buttons (Edit, Monitor) between the result name area and RatingBadge
   - Use react-router-dom `Link` component
   - Style as small pill-style controls matching the existing design language
   - Navigate to design/monitor with `?result=<id>` query param

2. **ResultDesignPage.tsx** — Read `?result=` search param via `useSearchParams`
   - If present, filter `data.results` to only show the matching result
   - If absent, show all results (current behavior preserved)
   - Add a "Back to overview" or "Show all" link when filtered

3. **MonitorPage.tsx** — Same `?result=` filtering pattern
   - If present, filter to only that result's subindicators
   - If absent, show all (current behavior preserved)
   - Add a "Back to overview" or "Show all" link when filtered

## Files to Change

- `src/components/overview/ResultRow.tsx` — Add Edit/Monitor buttons
- `src/pages/ResultDesignPage.tsx` — Add query param filtering
- `src/pages/MonitorPage.tsx` — Add query param filtering
