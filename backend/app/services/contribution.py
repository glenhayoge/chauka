"""Contribution analysis — computes outcome-level progress from weighted output indicators."""

from __future__ import annotations


def _parse_numeric(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _compute_indicator_progress(
    indicator_id: int,
    subindicators: list[dict],
    data_entries: list[dict],
    targets: list[dict],
    periods: list[dict],
) -> float | None:
    """Compute average progress (actual/target * 100) across subindicators for last period."""
    sorted_periods = sorted(periods, key=lambda p: (p.get("end_year", 0), p.get("end_month", 0)))
    if not sorted_periods:
        return None
    last_period_id = sorted_periods[-1]["id"]

    my_subs = [s for s in subindicators if s.get("indicator_id") == indicator_id]
    if not my_subs:
        return None

    # Build target lookup for last period
    target_lookup = {}
    for t in targets:
        if t.get("indicator_id") == indicator_id and t.get("milestone_id") == last_period_id:
            target_lookup[t["subindicator_id"]] = _parse_numeric(t.get("value"))

    # Get latest actual for each subindicator (last column entry)
    sub_ids = {s["id"] for s in my_subs}
    latest_actuals: dict[int, float] = {}
    for de in data_entries:
        if de.get("subindicator_id") in sub_ids and not de.get("is_computed", False):
            v = _parse_numeric(de.get("data"))
            if v is not None:
                # Keep overwriting — entries are ordered by column, last is latest
                latest_actuals[de["subindicator_id"]] = v

    progress_values = []
    for sub in my_subs:
        sid = sub["id"]
        target = target_lookup.get(sid)
        actual = latest_actuals.get(sid)
        if target and target > 0 and actual is not None:
            progress_values.append((actual / target) * 100)

    if not progress_values:
        return None
    return round(sum(progress_values) / len(progress_values), 1)


def compute_contribution_scores(
    results: list[dict],
    indicators: list[dict],
    subindicators: list[dict],
    data_entries: list[dict],
    targets: list[dict],
    periods: list[dict],
) -> list[dict]:
    """Compute contribution scores for parent results from their children.

    For each parent result (e.g., Outcome), compute weighted progress from child results
    (e.g., Outputs) using contribution_weighting.

    Returns:
        [
            {
                "result_id": 5,
                "score": 72.5,
                "children": [
                    {"result_id": 10, "name": "...", "weight": 60, "progress": 80.0},
                    {"result_id": 11, "name": "...", "weight": 40, "progress": 60.0},
                ]
            }
        ]
    """
    # Build parent->children lookup
    result_lookup = {r["id"]: r for r in results}
    children_by_parent: dict[int, list[dict]] = {}
    for r in results:
        pid = r.get("parent_id")
        if pid:
            children_by_parent.setdefault(pid, []).append(r)

    # Build result->indicators lookup
    indicators_by_result: dict[int, list[dict]] = {}
    for ind in indicators:
        rid = ind.get("result_id")
        indicators_by_result.setdefault(rid, []).append(ind)

    scores = []
    for parent_id, children in children_by_parent.items():
        if parent_id not in result_lookup:
            continue

        child_scores = []
        total_weight = sum(c.get("contribution_weighting", 100) for c in children)

        for child in children:
            child_indicators = indicators_by_result.get(child["id"], [])
            if not child_indicators:
                continue

            # Average progress across all indicators for this child result
            progresses = []
            for ind in child_indicators:
                p = _compute_indicator_progress(
                    ind["id"], subindicators, data_entries, targets, periods
                )
                if p is not None:
                    progresses.append(p)

            if progresses:
                avg_progress = round(sum(progresses) / len(progresses), 1)
                child_scores.append({
                    "result_id": child["id"],
                    "name": child.get("name", ""),
                    "weight": child.get("contribution_weighting", 100),
                    "progress": avg_progress,
                })

        if child_scores and total_weight > 0:
            weighted_sum = sum(
                (cs["progress"] * cs["weight"] / total_weight)
                for cs in child_scores
            )
            scores.append({
                "result_id": parent_id,
                "score": round(weighted_sum, 1),
                "children": child_scores,
            })

    return scores
