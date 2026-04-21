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


class EmailTemplate(Base):
    """Template d'email transactionnel/séquence, éditable depuis l'admin.

    Chaque template appartient à une séquence (ex: "b2b_onboarding") et
    occupe une position (step_order). Le delay_hours est le délai depuis le
    déclenchement de la séquence pour cet email.
    """

    __tablename__ = "email_templates"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    # ex: "b2b_onboarding_j0", "b2c_letter_j3"

    sequence_key: Mapped[str] = mapped_column(String(32), index=True)
    # ex: "b2b_onboarding", "b2b_pre_expiry", "b2c_letter"
    sequence_label: Mapped[str] = mapped_column(String(120))
    # ex: "B2B — Onboarding post-checkout"
    audience: Mapped[str] = mapped_column(String(8), default="b2b")  # "b2b" | "b2c"

    step_order: Mapped[int] = mapped_column(Integer, default=0)
    step_label: Mapped[str] = mapped_column(String(120), default="")
    # ex: "J+0 — Bienvenue + codes"

    delay_hours: Mapped[int] = mapped_column(Integer, default=0)
    # Délai relatif au trigger de la séquence. 0 = immédiat, 48 = J+2, -336 = J-14.

    subject: Mapped[str] = mapped_column(String(200))
    preview: Mapped[str | None] = mapped_column(String(240), nullable=True)
    html_content: Mapped[str] = mapped_column(Text)
    text_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    # Si False : la séquence ne planifie pas cet envoi (utile pour B2C en attente
    # des events dépendants de la création de compte).

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Notes internes (ex: "en attente d'implémentation des events B2C").

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)
    updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # email de l'admin ayant modifié, ou "seed" pour les valeurs d'origine


class ScheduledEmail(Base):
    """File d'envois d'emails planifiés. Le scheduler dépile cette table.

    Sert aussi d'historique (status='sent' = traces permanentes).
    """

    __tablename__ = "scheduled_emails"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    template_key: Mapped[str] = mapped_column(
        ForeignKey("email_templates.key", ondelete="SET NULL"), nullable=True, index=True
    )
    # SET NULL pour préserver l'historique même si un template est supprimé.
    sequence_key: Mapped[str] = mapped_column(String(32), index=True)
    step_order: Mapped[int] = mapped_column(Integer, default=0)

    recipient_email: Mapped[str] = mapped_column(String(200), index=True)
    recipient_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Contexte de rendu (JSON sérialisé). ex: {"company_name": "Acme", "seats": 10}
    context_json: Mapped[str] = mapped_column(Text, default="{}")

    # Sujet identifiant dans le domaine métier (org_id, user_id, etc.) — sert à
    # l'idempotence et à la suppression en cascade si la cible disparaît.
    subject_type: Mapped[str] = mapped_column(String(32), default="organization")
    # "organization" | "b2c_user"
    subject_id: Mapped[str] = mapped_column(String(36), index=True)

    send_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    # "pending" | "sent" | "cancelled" | "failed"
    cancel_reason: Mapped[str | None] = mapped_column(String(120), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    brevo_message_id: Mapped[str | None] = mapped_column(String(200), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class ContentCluster(Base):
    """Cluster de contenu (pillar + articles liés) pour maillage interne SEO."""

    __tablename__ = "content_clusters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    pillar_post_id: Mapped[str | None] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="SET NULL"), nullable=True
    )
    target_keyword_family: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    audience: Mapped[str] = mapped_column(String(8), default="all")


class BlogPost(Base):
    """Article du blog éditorial ELSAI."""

    __tablename__ = "blog_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text)
    hero_eyebrow: Mapped[str | None] = mapped_column(String(120), nullable=True)
    content_mdx: Mapped[str] = mapped_column(Text, default="")
    tags_json: Mapped[str] = mapped_column(Text, default="[]")
    reading_minutes: Mapped[int] = mapped_column(Integer, default=0)
    audience: Mapped[str] = mapped_column(String(8), default="adult")
    # "adult" | "minor" | "b2b" | "all"
    target_keyword: Mapped[str | None] = mapped_column(String(200), nullable=True)
    search_intent: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cluster_id: Mapped[str | None] = mapped_column(
        ForeignKey("content_clusters.id", ondelete="SET NULL"), nullable=True
    )
    readability_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    readability_level: Mapped[str | None] = mapped_column(String(8), nullable=True)
    freshness_review_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    author_id: Mapped[str | None] = mapped_column(
        ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    author_display: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="draft", index=True)
    # "draft" | "review" | "scheduled" | "published" | "private" | "archived"
    kind: Mapped[str] = mapped_column(String(16), default="article", index=True)
    # "article" (blog éditorial) | "help" (centre d'aide / guide utilisateur)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    schema_type: Mapped[str] = mapped_column(String(32), default="Article")
    # "Article" | "HowTo" | "FAQPage" | "GovernmentService"
    schema_extra_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class CTABlock(Base):
    """CTA réutilisable + A/B testable (pattern PromptVersion)."""

    __tablename__ = "cta_blocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    key: Mapped[str] = mapped_column(String(64), index=True)
    label: Mapped[str] = mapped_column(String(200))
    variant: Mapped[str] = mapped_column(String(64), default="control")
    component: Mapped[str] = mapped_column(String(64))
    audience: Mapped[str] = mapped_column(String(8), default="all")
    props_json: Mapped[str] = mapped_column(Text, default="{}")
    auto_inject_rules_json: Mapped[str] = mapped_column(Text, default="{}")
    weight: Mapped[int] = mapped_column(Integer, default=100)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class PostCTA(Base):
    """Rattachement CTA ↔ article."""

    __tablename__ = "post_ctas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    post_id: Mapped[str] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="CASCADE"), index=True
    )
    cta_key: Mapped[str] = mapped_column(String(64), index=True)
    position: Mapped[str] = mapped_column(String(16), default="inline")
    # "inline" | "end" | "sticky"
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class PageContent(Base):
    """Contenu éditable de pages statiques (offre, pour-qui, etc.)."""

    __tablename__ = "page_contents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    page_key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    blocks_json: Mapped[str] = mapped_column(Text, default="[]")
    audience: Mapped[str] = mapped_column(String(8), default="all")
    seo_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    schema_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    schema_extra_json: Mapped[str] = mapped_column(Text, default="{}")
    status: Mapped[str] = mapped_column(String(16), default="published")
    draft_blocks_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)
    updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)


class ContentRevision(Base):
    """Snapshot d'un contenu avant modification (audit + rollback)."""

    __tablename__ = "content_revisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(32), index=True)
    entity_id: Mapped[str] = mapped_column(String(64), index=True)
    snapshot_json: Mapped[str] = mapped_column(Text)
    author_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)


class SlugRedirect(Base):
    """Redirections 301 lors du changement de slug."""

    __tablename__ = "slug_redirects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    entity_type: Mapped[str] = mapped_column(String(32), index=True)
    old_slug: Mapped[str] = mapped_column(String(200), index=True)
    new_slug: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class NewsletterSubscriber(Base):
    """Abonné newsletter (email hashé — RGPD minimal)."""

    __tablename__ = "newsletter_subscribers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    audience: Mapped[str] = mapped_column(String(8), default="adult")
    lead_magnet_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    consent_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    unsubscribed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    brevo_contact_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class LeadMagnet(Base):
    """Ressource téléchargeable (guide PDF, etc.) qui déclenche une séquence."""

    __tablename__ = "lead_magnets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    audience: Mapped[str] = mapped_column(String(8), default="adult")
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    trigger_sequence_key: Mapped[str | None] = mapped_column(String(32), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=False)


class ContentEvent(Base):
    """Events anonymes de consommation du contenu (view, CTA, scroll, opt-in)."""

    __tablename__ = "content_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_slug: Mapped[str] = mapped_column(String(200), index=True)
    event_type: Mapped[str] = mapped_column(String(32))
    # "view" | "cta_click" | "scroll_75" | "newsletter_subscribe"
    variant: Mapped[str | None] = mapped_column(String(64), nullable=True)
    session_hash: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)


class MetricEvent(Base):
    """Événements anonymes pour le dashboard POC (aucun contenu utilisateur)."""

    __tablename__ = "metric_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(32))  # "chat", "ocr", "danger", "forget"
    profile: Mapped[str] = mapped_column(String(16), default="adult")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
