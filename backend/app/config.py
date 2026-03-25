"""
Configuration management using Pydantic Settings
"""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env from project root (Content-Virality-Predictor/.env)
env_path = os.path.join(os.path.dirname(__file__), "../../.env")
if os.path.exists(env_path):
    load_dotenv(env_path, override=True)
else:
    load_dotenv(override=True)


class Settings(BaseSettings):
    # LLM Configuration
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    LLM_MODEL_NAME: str = "gemini-2.0-flash"

    # App Configuration
    SECRET_KEY: str = "change-me-please"
    DEBUG: bool = True
    PORT: int = 8000

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    class Config:
        env_file = "../../.env"
        extra = "ignore"


settings = Settings()
