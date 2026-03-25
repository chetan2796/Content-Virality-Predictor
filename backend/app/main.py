"""
FastAPI Application Factory
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .config import settings
from .router import router

# Setup logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("cvp.main")

app = FastAPI(
    title="Content Virality Predictor API",
    description="AI-powered simulation engine to predict content virality before you post.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5500", "http://127.0.0.1:5500", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(router, prefix="/api")

# Serve static frontend files (if the frontend/dist folder exists)
frontend_dist = os.path.join(os.path.dirname(__file__), "../../frontend")
if os.path.exists(frontend_dist):
    # Mount static assets
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_dist, "static"), html=False), name="static")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str = ""):
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Frontend not found. Run the frontend separately."}

logger.info("Content Virality Predictor API started")
