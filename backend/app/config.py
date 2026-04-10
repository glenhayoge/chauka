from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CHAUKA_",
        env_file=".env.local",
        env_file_encoding="utf-8",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/chauka"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    environment: str = "development"
    sentry_dsn: str = ""


settings = Settings()
