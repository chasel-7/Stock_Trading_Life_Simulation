import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Stock Life Simulator API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./stock_life.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"

    class Config:
        case_sensitive = True

settings = Settings()
