"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, List


# --- Request Models ---
class PredictRequest(BaseModel):
    script: str = Field(
        ...,
        min_length=20,
        max_length=10000,
        description="The video script or idea to analyze",
    )
    audience: Literal[
        "gen_z",
        "millennials",
        "tech_enthusiasts",
        "corporate_professionals",
        "general",
    ] = Field(default="general", description="Target audience segment")
    platform: Literal["youtube", "tiktok", "instagram", "twitter"] = Field(
        default="youtube", description="Target social media platform"
    )
    content_type: Literal["educational", "entertainment", "news", "marketing", "vlog"] = Field(
        default="entertainment", description="Category of the content"
    )


class ABTestRequest(BaseModel):
    script_a: str = Field(..., min_length=20, max_length=10000, description="Version A of the script")
    script_b: str = Field(..., min_length=20, max_length=10000, description="Version B of the script")
    audience: Literal[
        "gen_z", "millennials", "tech_enthusiasts", "corporate_professionals", "general"
    ] = Field(default="general")
    platform: Literal["youtube", "tiktok", "instagram", "twitter"] = Field(default="youtube")


# --- Response Models ---
class AgentFeedback(BaseModel):
    agent_name: str
    persona: str
    sentiment: Literal["positive", "negative", "neutral"]
    reaction: str
    would_share: bool


class WeaknessItem(BaseModel):
    issue: str
    suggestion: str


class ViralityReport(BaseModel):
    virality_score: int = Field(..., ge=0, le=100, description="Overall virality score 0-100")
    share_probability: float = Field(..., ge=0.0, le=1.0)
    estimated_retention: float = Field(..., ge=0.0, le=1.0)
    like_to_view_ratio: float = Field(..., ge=0.0, le=1.0)
    sentiment_breakdown: dict  # {positive: %, negative: %, neutral: %}
    hook_strength: int = Field(..., ge=0, le=10)
    audience_match: int = Field(..., ge=0, le=10)
    platform_fit: int = Field(..., ge=0, le=10)
    agent_feedback: List[AgentFeedback]
    strengths: List[str]
    weaknesses: List[WeaknessItem]
    overall_verdict: str
    improvement_summary: str


class PredictResponse(BaseModel):
    success: bool
    report: Optional[ViralityReport] = None
    error: Optional[str] = None


class ABTestReport(BaseModel):
    winner: Literal["A", "B", "tie"]
    version_a: ViralityReport
    version_b: ViralityReport
    comparison_summary: str


class ABTestResponse(BaseModel):
    success: bool
    report: Optional[ABTestReport] = None
    error: Optional[str] = None
