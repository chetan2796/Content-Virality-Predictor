"""
Content Virality Predictor - FastAPI Backend
Entry point
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    from app.config import settings
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
