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

    # RGPD — durée de rétention session inactive (heures)
    session_retention_hours: int = 24

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
