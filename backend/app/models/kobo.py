"""KoboToolBox integration models.

Stores connection configuration and field mappings that link
KoboToolBox form questions to Chauka sub-indicators for automated
data import.
"""

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class KoboConnection(Base):
    """A KoboToolBox API connection tied to a logframe."""

    __tablename__ = "kobo_connection"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    logframe_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logframe_logframe.id", ondelete="CASCADE"), nullable=False
    )
    server_url: Mapped[str] = mapped_column(
        String(500), nullable=False, default="https://kf.kobotoolbox.org"
    )
    api_token: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    mappings: Mapped[list["KoboFieldMapping"]] = relationship(
        back_populates="connection", cascade="all, delete-orphan"
    )


class KoboFieldMapping(Base):
    """Maps a KoboToolBox form field to a Chauka sub-indicator + column."""

    __tablename__ = "kobo_field_mapping"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("kobo_connection.id", ondelete="CASCADE"), nullable=False
    )
    kobo_form_id: Mapped[str] = mapped_column(String(255), nullable=False)
    kobo_field_name: Mapped[str] = mapped_column(String(255), nullable=False)
    subindicator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logframe_subindicator.id", ondelete="CASCADE"), nullable=False
    )
    column_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("logframe_column.id", ondelete="SET NULL"), nullable=True
    )
    # If True, auto-create a new Column per sync (named by submission date)
    auto_create_column: Mapped[bool] = mapped_column(Boolean, default=False)
    # Aggregation method when multiple submissions exist
    aggregation: Mapped[str] = mapped_column(
        String(20), default="latest"
    )  # latest, sum, average, count
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    connection: Mapped["KoboConnection"] = relationship(back_populates="mappings")


class KoboSyncLog(Base):
    """Audit log for each sync operation."""

    __tablename__ = "kobo_sync_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    connection_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("kobo_connection.id", ondelete="CASCADE"), nullable=False
    )
    synced_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # success, partial, error
    submissions_fetched: Mapped[int] = mapped_column(Integer, default=0)
    entries_created: Mapped[int] = mapped_column(Integer, default=0)
    entries_updated: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
