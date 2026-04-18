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
    # A/B testing : version de prompt ayant servi à générer cette réponse assistant
    prompt_version_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
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


class DangerAlert(Base):
    """Détection de danger (mineur) à superviser côté admin.

    Aucun PII : on stocke uniquement session_id (UUID anonyme), topic,
    extrait tronqué, source (heuristic/llm), statut de prise en charge.
    """

    __tablename__ = "danger_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(String(36), index=True)
    conversation_id: Mapped[str] = mapped_column(String(36), index=True)
    profile: Mapped[str] = mapped_column(String(16), default="minor")
    source: Mapped[str] = mapped_column(String(16), default="llm")  # "heuristic" | "llm" | "both"
    excerpt: Mapped[str] = mapped_column(Text)  # 240 chars max, tronqué
    status: Mapped[str] = mapped_column(String(24), default="new")
    # "new" | "reviewing" | "escalated_119" | "closed"
    reviewer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class AuditLog(Base):
    """Journal d'audit anonymisé des actions admin et events sensibles."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str] = mapped_column(String(32), default="system")
    # "admin" | "system" | "user"
    action: Mapped[str] = mapped_column(String(64), index=True)
    # ex: "prompt.update", "alert.status_change", "forget.executed"
    target_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON sérialisé
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)


class PromptVersion(Base):
    """Historique des versions de prompts système éditables via admin.

    A/B testing : plusieurs versions peuvent être actives simultanément avec
    des poids différents. La sélection se fait par tirage pondéré à chaque
    appel LLM. `label` sert à nommer les bras d'expérimentation.
    """

    __tablename__ = "prompt_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), index=True)
    label: Mapped[str] = mapped_column(String(64), default="v1")  # "control", "variant_A", …
    content: Mapped[str] = mapped_column(Text)
    weight: Mapped[int] = mapped_column(Integer, default=100)  # 0 = désactivé
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class AdminUser(Base):
    """Utilisateur du backoffice avec rôle RBAC."""

    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    role: Mapped[str] = mapped_column(String(32), default="content_editor")
    # "super_admin" | "moderator_119" | "content_editor" | "b2b_sales"
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class FeatureFlag(Base):
    """Modules activables à chaud (CAF, logement, emploi, annuaire…)."""

    __tablename__ = "feature_flags"

    name: Mapped[str] = mapped_column(String(64), primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(String(400), nullable=True)
    category: Mapped[str] = mapped_column(String(32), default="module")  # "module" | "parcours" | "theme"
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class LetterTemplate(Base):
    """Courrier type (modèle) utilisable comme base pour générer des courriers personnalisés."""

    __tablename__ = "letter_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(64), default="general")
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class MetricEvent(Base):
    """Événements anonymes pour le dashboard POC (aucun contenu utilisateur)."""

    __tablename__ = "metric_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(32))  # "chat", "ocr", "danger", "forget"
    profile: Mapped[str] = mapped_column(String(16), default="adult")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
