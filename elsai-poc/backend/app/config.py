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
    cors_origins: str = "http://localhost:3000"

    # Dashboard admin (POC : token partagé simple, à remplacer par un vrai IAM en prod)
    admin_token: str = ""

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

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
