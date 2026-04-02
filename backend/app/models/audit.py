from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts_user.id"))
    action: Mapped[str] = mapped_column(String(20))  # create, update, delete
    entity_type: Mapped[str] = mapped_column(String(50))  # result, indicator, activity, etc.
    entity_id: Mapped[int] = mapped_column(Integer)
    changes: Mapped[str] = mapped_column(Text, default="{}")  # JSON diff
    logframe_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("logframe_logframe.id"), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
