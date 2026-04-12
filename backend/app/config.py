from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Battle of Algorithms API"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    database_url: str = Field(
        default="postgresql+psycopg://boa:boa@localhost:5432/battle_of_algorithms"
    )
    keycloak_server_url: str = "http://localhost:8080"
    keycloak_realm: str = "battle-of-algorithms"
    keycloak_backend_client_id: str = "backend"
    keycloak_backend_client_secret: str = "replace-me"
    cors_allow_origins: str = "http://localhost:3000"
    internal_api_secret: str = "boa-internal-dev-secret"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
