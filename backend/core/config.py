from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Scalable Chat Server (FastAPI)"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/chatdb"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "super-secret-key-123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
