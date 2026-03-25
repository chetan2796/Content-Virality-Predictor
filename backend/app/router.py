"""
FastAPI Router — All API endpoints
"""
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from .models import (
    PredictRequest,
    PredictResponse,
    ABTestRequest,
    ABTestResponse,
)
from .engine import run_virality_simulation, run_ab_test

logger = logging.getLogger("cvp.router")
router = APIRouter()


@router.get("/health")
async def health():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "Content Virality Predictor API"}


@router.post("/predict", response_model=PredictResponse)
async def predict_virality(request: PredictRequest):
    """
    Main prediction endpoint.
    Runs a multi-agent simulation and returns a virality report.
    """
    try:
        report = await run_virality_simulation(
            script=request.script,
            audience=request.audience,
            platform=request.platform,
            content_type=request.content_type,
        )
        return PredictResponse(success=True, report=report)
    except ValueError as e:
        logger.warning(f"Validation error in /predict: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in /predict: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/ab-test", response_model=ABTestResponse)
async def ab_test(request: ABTestRequest):
    """
    A/B testing endpoint.
    Compares two scripts and identifies the winner.
    """
    try:
        report = await run_ab_test(
            script_a=request.script_a,
            script_b=request.script_b,
            audience=request.audience,
            platform=request.platform,
        )
        return ABTestResponse(success=True, report=report)
    except ValueError as e:
        logger.warning(f"Validation error in /ab-test: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in /ab-test: {e}")
        raise HTTPException(status_code=500, detail=f"A/B test failed: {str(e)}")


@router.get("/audiences")
async def get_audiences():
    """Returns available audience options."""
    return {
        "audiences": [
            {"value": "gen_z", "label": "Gen Z (18-24)"},
            {"value": "millennials", "label": "Millennials (25-40)"},
            {"value": "tech_enthusiasts", "label": "Tech Enthusiasts"},
            {"value": "corporate_professionals", "label": "Corporate Professionals"},
            {"value": "general", "label": "General Audience"},
        ]
    }


@router.get("/platforms")
async def get_platforms():
    """Returns available platform options."""
    return {
        "platforms": [
            {"value": "youtube", "label": "YouTube"},
            {"value": "tiktok", "label": "TikTok"},
            {"value": "instagram", "label": "Instagram"},
            {"value": "twitter", "label": "Twitter (X)"},
        ]
    }
