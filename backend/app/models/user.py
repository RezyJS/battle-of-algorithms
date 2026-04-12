from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("keycloak_user_id", name="uq_users_keycloak_user_id"),
        UniqueConstraint("username", name="uq_users_username"),
        UniqueConstraint("email", name="uq_users_email"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    keycloak_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    left_battles = relationship(
        "Battle",
        foreign_keys="Battle.left_player_id",
        back_populates="left_player",
    )
    right_battles = relationship(
        "Battle",
        foreign_keys="Battle.right_player_id",
        back_populates="right_player",
    )
    created_battles = relationship(
        "Battle",
        foreign_keys="Battle.created_by",
        back_populates="creator",
    )
    moderated_submissions = relationship(
        "CodeSubmission",
        foreign_keys="CodeSubmission.moderated_by",
        back_populates="moderator",
    )
    submissions = relationship(
        "CodeSubmission",
        foreign_keys="CodeSubmission.user_id",
        back_populates="user",
    )
    reviews = relationship("SubmissionReview", back_populates="author")
    audit_events = relationship("AuditLog", back_populates="actor")
