import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App & Server
    PROJECT_NAME: str = "Aera Cloud"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8085
    HOST: str = "0.0.0.0"

    # Security
    SECRET_KEY: str = "test-secret-key-for-local-environment-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Hardware Pre-shared Key
    DEVICE_PRESHARED_KEY: str = "aera-esp32-secure-token-default"

    # Database & Cache
    DATABASE_URL: str = "sqlite+aiosqlite:///:memory:"
    DIRECT_URL: str | None = None
    REDIS_URL: str | None = None

    # AI Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Titan Email SMTP Settings
    MAIL_SERVER: str = "smtp.titan.email"
    MAIL_PORT: int = 465
    MAIL_USERNAME: str = "contact@hacksmiths.dev"
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "contact@hacksmiths.dev"
    MAIL_FROM_NAME: str = "Aera by HackSmiths"
    MAIL_USE_TLS: bool = False
    MAIL_USE_SSL: bool = True

    # Cloudflare & Domain Endpoints
    CLOUDFLARE_TUNNEL_TOKEN: str | None = None
    CLOUD_BASE_URL: str = "https://aera-cloud.hacksmiths.dev"
    WEB_BASE_URL: str = "https://aera.hacksmiths.dev"

    # Mobile App Configuration
    MOBILE_APP_SCHEME: str = "aera://"
    EXPO_PROJECT_ID: str | None = None

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        # Vite Dashboard
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Expo / React Native Dev Servers
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19000",
        "http://localhost:19006",
        # Cloudflare Tunnel Domains
        "https://aera.hacksmiths.dev",
        "https://aera-cloud.hacksmiths.dev",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def ensure_asyncpg_scheme(cls, v: str) -> str:
        if v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()