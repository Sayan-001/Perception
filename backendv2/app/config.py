from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Perception Backend"
    VERSION: str = "1.0.0"
    API_STR: str = "/api/v2"

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # PostgreSQL Database URL
    DATABASE_URL: str

    # Generative AI Integrations
    GROQ_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )


settings = Settings()
