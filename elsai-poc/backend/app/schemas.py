from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Profile = Literal["adult", "minor"]


class SessionCreateRequest(BaseModel):
    profile: Profile = "adult"


class SessionResponse(BaseModel):
    session_id: str
    token: str
    profile: Profile
    expires_in: int


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: str | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    danger_detected: bool = False
    emergency_cta: dict | None = None  # {"label": "Appeler le 119", "phone": "119"}


class DocumentAnalyzeResponse(BaseModel):
    ocr_text: str
    explanation: str
    suggested_actions: list[str]


class DashboardMetrics(BaseModel):
    total_sessions: int
    active_last_hour: int
    chats_total: int
    ocr_total: int
    danger_detections_total: int
    forget_requests_total: int
    profile_breakdown: dict[str, int]


class ForgetResponse(BaseModel):
    deleted_conversations: int
    deleted_messages: int


class TranscribeResponse(BaseModel):
    text: str


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


# =================== Admin ===================

AlertStatus = Literal["new", "reviewing", "escalated_119", "closed"]


class DangerAlertView(BaseModel):
    id: str
    session_id: str
    conversation_id: str
    profile: str
    source: str
    excerpt: str
    status: AlertStatus
    reviewer_note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DangerAlertUpdate(BaseModel):
    status: AlertStatus
    reviewer_note: str | None = Field(default=None, max_length=2000)


class PromptView(BaseModel):
    name: str
    content: str
    is_default: bool  # True = chargé depuis .md, False = override DB
    version_id: int | None
    updated_at: datetime | None


class PromptUpdate(BaseModel):
    content: str = Field(..., min_length=10, max_length=20000)


class PromptVersionView(BaseModel):
    id: int
    name: str
    created_at: datetime
    active: bool

    model_config = {"from_attributes": True}


class AuditLogView(BaseModel):
    id: int
    actor: str
    action: str
    target_type: str | None
    target_id: str | None
    details: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ForgetRequestView(BaseModel):
    """Événement 'forget' agrégé (anonyme, pas de session_id)."""

    id: int
    profile: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Admin users (RBAC) ----------

AdminRole = Literal[
    "super_admin",
    "moderator_119",
    "content_editor",
    "content_reviewer",
    "content_author",
    "b2b_sales",
]


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    role: AdminRole
    email: str
    expires_in: int


class AdminUserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=8, max_length=200)
    role: AdminRole


class AdminUserUpdate(BaseModel):
    role: AdminRole | None = None
    active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=200)


class AdminUserView(BaseModel):
    id: str
    email: str
    role: AdminRole
    active: bool
    created_at: datetime
    last_login: datetime | None

    model_config = {"from_attributes": True}


# ---------- A/B testing prompts ----------


class PromptVersionFull(BaseModel):
    id: int
    name: str
    label: str
    content: str
    weight: int
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PromptVariantCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=64)
    content: str = Field(..., min_length=10, max_length=20000)
    weight: int = Field(default=50, ge=0, le=1000)


class PromptWeightUpdate(BaseModel):
    """Mise à jour des poids d'expérimentation (batch)."""

    weights: dict[int, int]  # {version_id: weight}


class PromptVariantStats(BaseModel):
    version_id: int
    label: str
    weight: int
    active: bool
    messages_served: int
    danger_flags: int


# ---------- Feature flags ----------


class FeatureFlagView(BaseModel):
    name: str
    enabled: bool
    description: str | None
    category: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeatureFlagUpsert(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    enabled: bool = True
    description: str | None = Field(default=None, max_length=400)
    category: Literal["module", "parcours", "theme"] = "module"


class FeatureFlagToggle(BaseModel):
    enabled: bool
