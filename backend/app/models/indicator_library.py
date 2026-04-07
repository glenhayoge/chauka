from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LibraryIndicator(Base):
    __tablename__ = "library_indicator"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(500))
    organisation_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("org_organisation.id"), nullable=True
    )
    sector: Mapped[str] = mapped_column(String(100), default="")
    result_level: Mapped[str] = mapped_column(String(50), default="")
    definition: Mapped[str] = mapped_column(Text, default="")
    unit_of_measure: Mapped[str] = mapped_column(String(100), default="")
    calculation_method: Mapped[str] = mapped_column(Text, default="")
    data_source: Mapped[str] = mapped_column(String(500), default="")
    data_collection_method: Mapped[str] = mapped_column(String(255), default="")
    reporting_frequency: Mapped[str] = mapped_column(String(50), default="")
    disaggregation_fields: Mapped[str] = mapped_column(Text, default="")
    framework: Mapped[str] = mapped_column(String(100), default="")
    framework_code: Mapped[str] = mapped_column(String(100), default="")
    measurement_type: Mapped[str] = mapped_column(String(50), default="numeric")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("contacts_user.id"), nullable=True
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organisation: Mapped["Organisation | None"] = relationship("Organisation")
    created_by: Mapped["User | None"] = relationship("User")

    __table_args__ = (
        Index("ix_library_indicator_sector_level", "sector", "result_level"),
        Index("ix_library_indicator_org_id", "organisation_id"),
        Index("ix_library_indicator_name", "name"),
        Index("ix_library_indicator_framework", "framework"),
    )


class LibraryIndicatorSector(Base):
    __tablename__ = "library_indicator_sector"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
