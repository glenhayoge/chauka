"""Google Sheets integration models.

Stores connection configuration and column mappings that link
Google Sheets columns to Chauka sub-indicators for automated
data import via service account authentication.
"""

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GoogleSheetsConnection(Base):
    """A Google Sheets connection tied to a logframe via service account."""

    __tablename__ = "gsheets_connection"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    logframe_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logframe_logframe.id", ondelete="CASCADE"), nullable=False
    )
    spreadsheet_id: Mapped[str] = mapped_column(String(255), nullable=False)
    sheet_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Service account credentials JSON (stored encrypted in production)
    service_account_json: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    mappings: Mapped[list["GoogleSheetsColumnMapping"]] = relationship(
        back_populates="connection", cascade="all, delete-orphan"
    )


class GoogleSheetsColumnMapping(Base):
    """Maps a Google Sheets column to a Chauka sub-indicator + period column."""

    __tablename__ = "gsheets_column_mapping"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gsheets_connection.id", ondelete="CASCADE"), nullable=False
    )
    sheet_column: Mapped[str] = mapped_column(String(255), nullable=False)
    subindicator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logframe_subindicator.id", ondelete="CASCADE"), nullable=False
    )
    column_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("logframe_column.id", ondelete="SET NULL"), nullable=True
    )
    # If True, auto-create a new Column per sync (named by sync date)
    auto_create_column: Mapped[bool] = mapped_column(Boolean, default=False)
    # Row aggregation method when multiple rows exist
    aggregation: Mapped[str] = mapped_column(
        String(20), default="latest"
    )  # latest, sum, average, count
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    connection: Mapped["GoogleSheetsConnection"] = relationship(back_populates="mappings")


class GoogleSheetsSyncLog(Base):
    """Audit log for each Google Sheets sync operation."""

    __tablename__ = "gsheets_sync_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gsheets_connection.id", ondelete="CASCADE"), nullable=False
    )
    synced_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # success, partial, error
    rows_fetched: Mapped[int] = mapped_column(Integer, default=0)
    entries_created: Mapped[int] = mapped_column(Integer, default=0)
    entries_updated: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
