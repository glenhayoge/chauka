# Issue #1: Implement result hierarchy with expand/collapse and level labels

**GitHub:** glenhayoge/kashana-web#1
**Type:** Frontend-only
**Priority:** High

## Plan

### Tasks (all frontend)

1. **Update UI store** — add `initExpandedResults` action that auto-expands results at level <= 2
2. **Update OverviewPage** — build result tree from flat array, sort by order, render recursively
3. **Rewrite ResultRow** — add level labels, triangle toggle, indent, description, placeholder row

### Key decisions
- Level labels: `{1: "Impact (Goal)", 2: "Outcome", 3: "Output"}`
- `open_result_level` default = 2 (from bootstrap `settings` or hardcoded)
- Sort children by `order` within each parent group
- Indent via `ml-{n}` based on depth
- Toggle uses `expandedResults` Set in UI store
- Description rendered as HTML below name using `dangerouslySetInnerHTML`
- "Click to add title" placeholder at bottom (display-only for now, full impl in Issue #13)
