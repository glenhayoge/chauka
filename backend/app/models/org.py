from __future__ import annotations

import enum
import secrets
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrgRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class ProjectRoleType(str, enum.Enum):
    lead = "lead"
    collector = "collector"
    viewer = "viewer"


class Organisation(Base):
    __tablename__ = "org_organisation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    logo_url: Mapped[str] = mapped_column(String(500), default="")
    country: Mapped[str] = mapped_column(String(100), default="")
    org_type: Mapped[str] = mapped_column(String(100), default="")
    sector: Mapped[str] = mapped_column(String(100), default="")
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts_user.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship("User")
    programs: Mapped[list[Program]] = relationship(
        "Program", back_populates="organisation", cascade="all, delete-orphan"
    )
    memberships: Mapped[list[OrganisationMembership]] = relationship(
        "OrganisationMembership", back_populates="organisation", cascade="all, delete-orphan"
    )


class Program(Base):
    __tablename__ = "org_program"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    organisation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("org_organisation.id")
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    organisation: Mapped[Organisation] = relationship(
        "Organisation", back_populates="programs"
    )
    projects: Mapped[list[Project]] = relationship(
        "Project", back_populates="program", cascade="all, delete-orphan"
    )
    logframes: Mapped[list["Logframe"]] = relationship(
        "Logframe", back_populates="program"
    )


class Project(Base):
    __tablename__ = "org_project"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    program_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("org_program.id"), nullable=True
    )
    organisation_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("org_organisation.id"), nullable=True
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")

    program: Mapped[Program | None] = relationship("Program", back_populates="projects")
    logframes: Mapped[list["Logframe"]] = relationship(
        "Logframe", back_populates="project"
    )
    roles: Mapped[list[ProjectRole]] = relationship(
        "ProjectRole", back_populates="project", cascade="all, delete-orphan"
    )


class OrganisationMembership(Base):
    __tablename__ = "org_membership"
    __table_args__ = (
        UniqueConstraint("user_id", "organisation_id", name="uq_org_membership"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts_user.id"))
    organisation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("org_organisation.id")
    )
    role: Mapped[OrgRole] = mapped_column(
        Enum(OrgRole, name="org_role_enum", create_constraint=True),
        default=OrgRole.member,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User")
    organisation: Mapped[Organisation] = relationship(
        "Organisation", back_populates="memberships"
    )


class ProjectRole(Base):
    __tablename__ = "org_project_role"
    __table_args__ = (
        UniqueConstraint("user_id", "project_id", name="uq_project_role"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts_user.id"))
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("org_project.id"))
    role: Mapped[ProjectRoleType] = mapped_column(
        Enum(ProjectRoleType, name="project_role_enum", create_constraint=True),
        default=ProjectRoleType.viewer,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User")
    project: Mapped[Project] = relationship("Project", back_populates="roles")


class Invitation(Base):
    """Pending invitation to join an organisation."""

    __tablename__ = "org_invitation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organisation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("org_organisation.id", ondelete="CASCADE")
    )
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    role: Mapped[OrgRole] = mapped_column(
        Enum(OrgRole, name="invite_role_enum", create_constraint=True),
        default=OrgRole.member,
    )
    token: Mapped[str] = mapped_column(
        String(64), unique=True, default=lambda: secrets.token_urlsafe(32)
    )
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("contacts_user.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    accepted_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("contacts_user.id"), nullable=True)

    organisation: Mapped[Organisation] = relationship("Organisation")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
