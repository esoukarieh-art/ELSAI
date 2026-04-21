import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Anthropic
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"

    # OpenAI (Whisper STT + TTS)
    openai_api_key: str = ""

    # Database
    database_url: str = "sqlite:///./elsai_poc.db"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    session_expire_minutes: int = 60

    # CORS
    cors_origins: str = "http://localhost:3000,https://www.elsai.fr,https://elsai.fr"

    # Dashboard admin (POC : token partagé simple, à remplacer par un vrai IAM en prod)
    admin_token: str = ""

    # Token partagé pour prévisualiser un brouillon de page CMS
    # (query param ?preview=1&token=... sur /api/public/pages/{key}).
    admin_preview_token: str = secrets.token_hex(16)

    # OCR
    tesseract_cmd: str = ""

    # Stripe (facturation B2B)
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_essentiel_monthly: str = ""
    stripe_price_essentiel_yearly: str = ""
    stripe_price_premium_monthly: str = ""
    stripe_price_premium_yearly: str = ""
    billing_success_url: str = "http://localhost:3000/offre/merci"
    billing_cancel_url: str = "http://localhost:3000/offre"
    billing_portal_return_url: str = "http://localhost:3000/offre"

    # Brevo (ex-Sendinblue) — email transactionnel
    brevo_api_key: str = ""
    brevo_sender_email: str = "no-reply@elsai.fr"
    brevo_sender_name: str = "ELSAI"
    # URL de base du frontend pour construire les liens dans les emails
    frontend_base_url: str = "http://localhost:3000"

    # Revalidation ISR frontend (Next.js) déclenchée après publish/update blog
    frontend_revalidate_url: str | None = None
    revalidate_secret: str | None = None

    # RGPD — durée de rétention session inactive (heures)
    session_retention_hours: int = 24

    # Email scheduler (séquences email)
    email_scheduler_enabled: bool = True
    email_scheduler_tick_minutes: int = 5

    # Plausible Analytics (self-host)
    plausible_site_id: str = ""
    plausible_api_key: str = ""
    plausible_api_url: str = "https://plausible.io/api/v2/query"

    # Observabilité
    log_level: str = "INFO"
    sentry_dsn: str = ""
    sentry_environment: str = "dev"
    sentry_release: str = ""
    sentry_traces_sample_rate: float = 0.1

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
