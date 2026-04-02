"""KoboToolBox integration service.

Handles communication with the KoboToolBox API and maps submissions
to Chauka DataEntry records.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.kobo import KoboConnection, KoboFieldMapping, KoboSyncLog
from app.models.logframe import Column, DataEntry


class KoboClient:
    """Thin wrapper around the KoboToolBox v2 API."""

    def __init__(self, server_url: str, api_token: str) -> None:
        self.base_url = server_url.rstrip("/")
        self.headers = {"Authorization": f"Token {api_token}"}

    async def list_forms(self) -> list[dict[str, Any]]:
        """Fetch deployed forms (assets) from the KoboToolBox account."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/api/v2/assets/",
                headers=self.headers,
                params={"format": "json", "asset_type": "survey"},
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json().get("results", [])

    async def get_form_fields(self, form_uid: str) -> list[dict[str, Any]]:
        """Fetch the question schema for a specific form."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/api/v2/assets/{form_uid}/",
                headers=self.headers,
                params={"format": "json"},
                timeout=30.0,
            )
            resp.raise_for_status()
            content = resp.json().get("content", {})
            return content.get("survey", [])

    async def get_submissions(
        self,
        form_uid: str,
        since: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch submissions for a form, optionally filtered by date."""
        params: dict[str, Any] = {"format": "json"}
        if since:
            params["query"] = f'{{"_submission_time":{{"$gte":"{since.isoformat()}"}}}}'
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/api/v2/assets/{form_uid}/data/",
                headers=self.headers,
                params=params,
                timeout=60.0,
            )
            resp.raise_for_status()
            return resp.json().get("results", [])


def aggregate_values(values: list[str], method: str) -> str:
    """Reduce a list of submission values to a single DataEntry value."""
    if not values:
        return ""
    if method == "latest":
        return values[-1]
    if method == "count":
        return str(len(values))

    # Numeric aggregations
    nums = []
    for v in values:
        try:
            nums.append(float(v))
        except (ValueError, TypeError):
            continue
    if not nums:
        return values[-1]  # fallback to latest if non-numeric

    if method == "sum":
        return str(sum(nums))
    if method == "average":
        return str(round(sum(nums) / len(nums), 2))
    return values[-1]


async def sync_connection(
    connection: KoboConnection,
    db: AsyncSession,
) -> KoboSyncLog:
    """Run a sync for all active mappings on a connection.

    For each mapping:
    1. Fetch submissions from KoboToolBox
    2. Extract the mapped field values
    3. Aggregate if needed
    4. Create or update DataEntry records in Chauka
    """
    client = KoboClient(connection.server_url, connection.api_token)
    log = KoboSyncLog(
        connection_id=connection.id,
        status="success",
        submissions_fetched=0,
        entries_created=0,
        entries_updated=0,
    )

    # Load active mappings
    result = await db.execute(
        select(KoboFieldMapping).where(
            KoboFieldMapping.connection_id == connection.id,
            KoboFieldMapping.is_active == True,  # noqa: E712
        )
    )
    mappings = result.scalars().all()
    if not mappings:
        log.status = "success"
        db.add(log)
        await db.commit()
        return log

    # Group mappings by form
    by_form: dict[str, list[KoboFieldMapping]] = {}
    for m in mappings:
        by_form.setdefault(m.kobo_form_id, []).append(m)

    try:
        for form_id, form_mappings in by_form.items():
            submissions = await client.get_submissions(form_id)
            log.submissions_fetched += len(submissions)

            for mapping in form_mappings:
                # Extract values for this field from all submissions
                values = []
                for sub in submissions:
                    val = sub.get(mapping.kobo_field_name)
                    if val is not None:
                        values.append(str(val))

                if not values:
                    continue

                aggregated = aggregate_values(values, mapping.aggregation)

                # Determine target column
                column_id = mapping.column_id
                if mapping.auto_create_column and column_id is None:
                    # Create a new column named by today's date
                    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                    col = Column(
                        name=today,
                        logframe_id=connection.logframe_id,
                    )
                    db.add(col)
                    await db.flush()
                    column_id = col.id

                if column_id is None:
                    continue  # no column target — skip

                # Upsert DataEntry
                existing = await db.execute(
                    select(DataEntry).where(
                        DataEntry.subindicator_id == mapping.subindicator_id,
                        DataEntry.column_id == column_id,
                    )
                )
                entry = existing.scalar_one_or_none()
                if entry:
                    entry.data = aggregated
                    log.entries_updated += 1
                else:
                    db.add(DataEntry(
                        subindicator_id=mapping.subindicator_id,
                        column_id=column_id,
                        data=aggregated,
                    ))
                    log.entries_created += 1

    except httpx.HTTPStatusError as exc:
        log.status = "error"
        log.error_message = f"KoboToolBox API error: {exc.response.status_code}"
    except httpx.RequestError as exc:
        log.status = "error"
        log.error_message = f"Connection error: {exc}"
    except Exception as exc:
        log.status = "error"
        log.error_message = str(exc)

    if log.status != "error" and log.entries_created == 0 and log.entries_updated == 0:
        log.status = "success"

    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
