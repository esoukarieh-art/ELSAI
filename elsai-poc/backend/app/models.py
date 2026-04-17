from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


class Session(Base):
    """Session anonyme. Aucun nom, aucun email. Purgeable à la demande."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    profile: Mapped[str] = mapped_column(String(16), default="adult")  # "adult" | "minor"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    last_activity: Mapped[datetime] = mapped_column(DateTime, default=_now)

    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    topic: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    session: Mapped["Session"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(16))  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    danger_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class Organization(Base):
    """Entreprise cliente B2B. Créée après checkout Stripe réussi."""

    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    company_name: Mapped[str] = mapped_column(String(200))
    siret: Mapped[str | None] = mapped_column(String(20), nullable=True)
    admin_email: Mapped[str] = mapped_column(String(200))

    plan: Mapped[str] = mapped_column(String(32))  # "essentiel" | "premium" | "sur_mesure"
    billing_cycle: Mapped[str] = mapped_column(String(16), default="monthly")  # "monthly" | "yearly"
    seats: Mapped[int] = mapped_column(Integer, default=0)

    stripe_customer_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    # "pending" | "active" | "past_due" | "canceled"

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    access_codes: Mapped[list["AccessCode"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )


class AccessCode(Base):
    """Code d'accès distribué aux salariés. Anonyme côté usage (pas de PII liée)."""

    __tablename__ = "access_codes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    organization: Mapped["Organization"] = relationship(back_populates="access_codes")


class MetricEvent(Base):
    """Événements anonymes pour le dashboard POC (aucun contenu utilisateur)."""

    __tablename__ = "metric_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(32))  # "chat", "ocr", "danger", "forget"
    profile: Mapped[str] = mapped_column(String(16), default="adult")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
