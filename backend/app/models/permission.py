"""Permission and RolePermission models for granular RBAC."""

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Permission(Base):
    __tablename__ = "admin_permission"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codename: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(50), default="general")


class RolePermission(Base):
    __tablename__ = "admin_role_permission"
    __table_args__ = (
        UniqueConstraint("role", "permission_id", name="uq_role_perm"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(50), index=True)
    permission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("admin_permission.id", ondelete="CASCADE")
    )
    permission: Mapped[Permission] = relationship("Permission")
