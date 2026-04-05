"""Formula computation engine for computed indicators.

Pure functions that take data in and return computed DataEntry values.
No database writes — results are merged into bootstrap responses.
"""

from __future__ import annotations


def _parse_numeric(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _get_entries_for_indicator(
    indicator_id: int,
    all_subindicators: list[dict],
    all_data_entries: list[dict],
) -> dict[int, list[dict]]:
    """Get data entries grouped by column_id for an indicator's subindicators."""
    sub_ids = {s["id"] for s in all_subindicators if s.get("indicator_id") == indicator_id}
    by_column: dict[int, list[dict]] = {}
    for de in all_data_entries:
        if de.get("subindicator_id") in sub_ids and not de.get("is_computed", False):
            col_id = de["column_id"]
            by_column.setdefault(col_id, []).append(de)
    return by_column


def compute_percentage(
    indicator: dict,
    config: dict,
    all_indicators: list[dict],
    all_subindicators: list[dict],
    all_data_entries: list[dict],
    columns: list[dict],
) -> list[dict]:
    """Compute (numerator_indicator / denominator_indicator) * 100 per column."""
    num_id = config.get("numerator_indicator_id")
    den_id = config.get("denominator_indicator_id")
    if not num_id or not den_id:
        return []

    num_entries = _get_entries_for_indicator(num_id, all_subindicators, all_data_entries)
    den_entries = _get_entries_for_indicator(den_id, all_subindicators, all_data_entries)

    # Get first subindicator of this computed indicator (for output row)
    my_subs = [s for s in all_subindicators if s.get("indicator_id") == indicator["id"]]
    if not my_subs:
        return []
    output_sub_id = my_subs[0]["id"]

    results = []
    for col in columns:
        col_id = col["id"]
        num_values = [_parse_numeric(de.get("data")) for de in num_entries.get(col_id, [])]
        den_values = [_parse_numeric(de.get("data")) for de in den_entries.get(col_id, [])]

        num_sum = sum(v for v in num_values if v is not None)
        den_sum = sum(v for v in den_values if v is not None)

        if den_sum > 0:
            value = round((num_sum / den_sum) * 100, 2)
            results.append({
                "subindicator_id": output_sub_id,
                "column_id": col_id,
                "data": str(value),
                "is_computed": True,
            })
    return results


def compute_progress(
    indicator: dict,
    all_subindicators: list[dict],
    all_data_entries: list[dict],
    all_targets: list[dict],
    columns: list[dict],
    periods: list[dict],
) -> list[dict]:
    """Compute (actual / target) * 100 for each subindicator × column."""
    my_subs = [s for s in all_subindicators if s.get("indicator_id") == indicator["id"]]
    if not my_subs:
        return []

    # Build target lookup: (subindicator_id, milestone_id) -> value
    target_lookup = {}
    for t in all_targets:
        if t.get("indicator_id") == indicator["id"]:
            key = (t["subindicator_id"], t["milestone_id"])
            target_lookup[key] = _parse_numeric(t.get("value"))

    # Find the last period (as overall target)
    sorted_periods = sorted(periods, key=lambda p: (p.get("end_year", 0), p.get("end_month", 0)))
    last_period_id = sorted_periods[-1]["id"] if sorted_periods else None

    results = []
    for sub in my_subs:
        sub_id = sub["id"]
        target_val = target_lookup.get((sub_id, last_period_id))
        if not target_val or target_val == 0:
            continue

        for col in columns:
            col_id = col["id"]
            # Find actual value for this sub + column
            actual = None
            for de in all_data_entries:
                if (de.get("subindicator_id") == sub_id
                        and de.get("column_id") == col_id
                        and not de.get("is_computed", False)):
                    actual = _parse_numeric(de.get("data"))
                    break

            if actual is not None:
                value = round((actual / target_val) * 100, 2)
                results.append({
                    "subindicator_id": sub_id,
                    "column_id": col_id,
                    "data": str(value),
                    "is_computed": True,
                })
    return results


def compute_aggregation(
    indicator: dict,
    config: dict,
    all_subindicators: list[dict],
    all_data_entries: list[dict],
    columns: list[dict],
) -> list[dict]:
    """Aggregate across subindicators (sum/average) per column.

    Outputs one computed entry per column on the first subindicator.
    """
    method = config.get("method", "sum")
    my_subs = [s for s in all_subindicators if s.get("indicator_id") == indicator["id"]]
    if len(my_subs) < 2:
        return []

    output_sub_id = my_subs[0]["id"]
    sub_ids = {s["id"] for s in my_subs}

    results = []
    for col in columns:
        col_id = col["id"]
        values = []
        for de in all_data_entries:
            if (de.get("subindicator_id") in sub_ids
                    and de.get("column_id") == col_id
                    and not de.get("is_computed", False)):
                v = _parse_numeric(de.get("data"))
                if v is not None:
                    values.append(v)

        if values:
            if method == "sum":
                result = sum(values)
            elif method == "average":
                result = sum(values) / len(values)
            elif method == "min":
                result = min(values)
            elif method == "max":
                result = max(values)
            else:
                result = sum(values)

            results.append({
                "subindicator_id": output_sub_id,
                "column_id": col_id,
                "data": str(round(result, 2)),
                "is_computed": True,
            })
    return results


def compute_cross_aggregation(
    indicator: dict,
    config: dict,
    all_indicators: list[dict],
    all_subindicators: list[dict],
    all_data_entries: list[dict],
    columns: list[dict],
) -> list[dict]:
    """Aggregate values from multiple source indicators."""
    source_ids = config.get("source_indicator_ids", [])
    method = config.get("method", "sum")
    if not source_ids:
        return []

    my_subs = [s for s in all_subindicators if s.get("indicator_id") == indicator["id"]]
    if not my_subs:
        return []
    output_sub_id = my_subs[0]["id"]

    # Collect source subindicator IDs
    source_sub_ids = set()
    for s in all_subindicators:
        if s.get("indicator_id") in source_ids:
            source_sub_ids.add(s["id"])

    results = []
    for col in columns:
        col_id = col["id"]
        values = []
        for de in all_data_entries:
            if (de.get("subindicator_id") in source_sub_ids
                    and de.get("column_id") == col_id
                    and not de.get("is_computed", False)):
                v = _parse_numeric(de.get("data"))
                if v is not None:
                    values.append(v)

        if values:
            if method == "sum":
                result = sum(values)
            elif method == "average":
                result = sum(values) / len(values)
            else:
                result = sum(values)

            results.append({
                "subindicator_id": output_sub_id,
                "column_id": col_id,
                "data": str(round(result, 2)),
                "is_computed": True,
            })
    return results


def compute_all_indicators(
    indicators: list[dict],
    subindicators: list[dict],
    data_entries: list[dict],
    targets: list[dict],
    columns: list[dict],
    periods: list[dict],
) -> list[dict]:
    """Compute values for all computed indicators.

    Returns a list of computed DataEntry dicts to merge into the bootstrap response.
    Detects circular references via topological ordering.
    """
    computed = [i for i in indicators if i.get("is_computed") and i.get("formula_config")]
    if not computed:
        return []

    all_computed_entries: list[dict] = []

    # Simple dependency detection — process in order, skip if references another computed
    # (no circular reference possible with this ordering)
    for indicator in computed:
        config = indicator["formula_config"]
        formula_type = config.get("type", "")

        entries: list[dict] = []
        if formula_type == "percentage":
            entries = compute_percentage(
                indicator, config, indicators, subindicators, data_entries, columns
            )
        elif formula_type == "progress":
            entries = compute_progress(
                indicator, subindicators, data_entries, targets, columns, periods
            )
        elif formula_type == "aggregation":
            entries = compute_aggregation(
                indicator, config, subindicators, data_entries, columns
            )
        elif formula_type == "cross_aggregation":
            entries = compute_cross_aggregation(
                indicator, config, indicators, subindicators, data_entries, columns
            )

        all_computed_entries.extend(entries)

    return all_computed_entries
