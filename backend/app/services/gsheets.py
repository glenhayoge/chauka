"""Google Sheets integration service.

Handles communication with the Google Sheets API via service account
authentication, and maps sheet data to Chauka DataEntry records.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gsheets import (
    GoogleSheetsColumnMapping,
    GoogleSheetsConnection,
    GoogleSheetsSyncLog,
)
from app.models.logframe import Column, DataEntry

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


class GoogleSheetsClient:
    """Wrapper around the Google Sheets API v4 using service account credentials."""

    def __init__(self, service_account_json: str) -> None:
        info = json.loads(service_account_json)
        creds = Credentials.from_service_account_info(info, scopes=SCOPES)
        self.service = build("sheets", "v4", credentials=creds, cache_discovery=False)

    def list_sheets(self, spreadsheet_id: str) -> list[dict[str, Any]]:
        """List all sheets (tabs) in a spreadsheet."""
        result = self.service.spreadsheets().get(
            spreadsheetId=spreadsheet_id,
            fields="sheets.properties",
        ).execute()
        sheets = result.get("sheets", [])
        return [
            {
                "title": s["properties"]["title"],
                "index": s["properties"]["sheetId"],
                "row_count": s["properties"]["gridProperties"]["rowCount"],
                "column_count": s["properties"]["gridProperties"]["columnCount"],
            }
            for s in sheets
        ]

    def get_headers(self, spreadsheet_id: str, sheet_name: str) -> list[dict[str, str]]:
        """Read the first row (headers) of a sheet and return column letter + header pairs."""
        result = self.service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=f"'{sheet_name}'!1:1",
        ).execute()
        row = result.get("values", [[]])[0]
        headers = []
        for i, value in enumerate(row):
            letter = _col_index_to_letter(i)
            headers.append({"letter": letter, "header": str(value).strip()})
        return headers

    def get_column_values(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        column_letter: str,
    ) -> list[str]:
        """Read all values in a column (excluding the header row)."""
        range_str = f"'{sheet_name}'!{column_letter}2:{column_letter}"
        result = self.service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_str,
        ).execute()
        rows = result.get("values", [])
        return [str(r[0]).strip() for r in rows if r and r[0]]

    def get_all_data(
        self,
        spreadsheet_id: str,
        sheet_name: str,
    ) -> tuple[list[str], list[list[str]]]:
        """Read all data from a sheet. Returns (headers, rows)."""
        result = self.service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=f"'{sheet_name}'",
        ).execute()
        all_rows = result.get("values", [])
        if not all_rows:
            return [], []
        headers = [str(h).strip() for h in all_rows[0]]
        data_rows = all_rows[1:]
        return headers, data_rows


def _col_index_to_letter(index: int) -> str:
    """Convert a 0-based column index to a spreadsheet letter (0=A, 25=Z, 26=AA)."""
    result = ""
    while True:
        result = chr(65 + (index % 26)) + result
        index = index // 26 - 1
        if index < 0:
            break
    return result


def aggregate_values(values: list[str], method: str) -> str:
    """Reduce a list of cell values to a single DataEntry value."""
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


async def sync_gsheets_connection(
    connection: GoogleSheetsConnection,
    db: AsyncSession,
) -> GoogleSheetsSyncLog:
    """Run a sync for all active mappings on a Google Sheets connection.

    For each mapping:
    1. Read column values from the Google Sheet
    2. Aggregate if needed
    3. Create or update DataEntry records in Chauka
    """
    log = GoogleSheetsSyncLog(
        connection_id=connection.id,
        status="success",
        rows_fetched=0,
        entries_created=0,
        entries_updated=0,
    )

    # Load active mappings
    result = await db.execute(
        select(GoogleSheetsColumnMapping).where(
            GoogleSheetsColumnMapping.connection_id == connection.id,
            GoogleSheetsColumnMapping.is_active == True,  # noqa: E712
        )
    )
    mappings = result.scalars().all()
    if not mappings:
        db.add(log)
        await db.commit()
        return log

    try:
        client = GoogleSheetsClient(connection.service_account_json)
        sheet_name = connection.sheet_name or "Sheet1"

        for mapping in mappings:
            # Read column values (excluding header)
            values = client.get_column_values(
                connection.spreadsheet_id,
                sheet_name,
                mapping.sheet_column,
            )
            log.rows_fetched = max(log.rows_fetched, len(values))

            if not values:
                continue

            aggregated = aggregate_values(values, mapping.aggregation)

            # Determine target column
            column_id = mapping.column_id
            if mapping.auto_create_column and column_id is None:
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

    except HttpError as exc:
        log.status = "error"
        log.error_message = f"Google Sheets API error: {exc.status_code} {exc.reason}"
    except json.JSONDecodeError:
        log.status = "error"
        log.error_message = "Invalid service account JSON"
    except Exception as exc:
        log.status = "error"
        log.error_message = str(exc)

    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
