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
