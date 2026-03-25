"""
AI Simulation Engine - The Core of Content Virality Predictor
Uses LLM to simulate multiple audience agents reacting to content
and generates a full virality prediction report.
"""
import json
import random
import logging
from typing import Optional
from openai import OpenAI

from .config import settings
from .models import (
    ViralityReport,
    AgentFeedback,
    WeaknessItem,
    ABTestReport,
)

logger = logging.getLogger("cvp.engine")


# ── Audience Persona Definitions ─────────────────────────────────────────────

AUDIENCE_PERSONAS = {
    "gen_z": [
        {"name": "Zara, 19", "traits": "Gen Z college student, addicted to TikTok, only watches content under 60 seconds, trendy slang, values authenticity."},
        {"name": "Kai, 22", "traits": "Gamer, active on YouTube shorts, loves memes, skeptical of brands, shares relatable content."},
        {"name": "Priya, 21", "traits": "Student activist, cares deeply about social issues, shares things that make her feel seen."},
        {"name": "Tyler, 20", "traits": "Skateboarder and influencer-wannabe, watches YouTube and TikTok daily."},
        {"name": "Mei, 23", "traits": "Design student, cares about aesthetics. Immediately scrolls if visuals aren't engaging."},
        {"name": "Leo, 18", "traits": "High schooler, music obsessed, follows viral trends, shares anything high-energy."},
        {"name": "Chloe, 24", "traits": "Recent grad, uses social media for travel inspo, loves high-production quality."},
        {"name": "Sam, 21", "traits": "Competitive gamer, watches streamers, highly critical of slow intros."},
        {"name": "Ivy, 19", "traits": "Cosplay lover, very active in niche communities, shares lore-heavy content."},
    ],
    "millennials": [
        {"name": "Raj, 32", "traits": "Software engineer, follows tech and productivity, values depth over entertainment."},
        {"name": "Sarah, 29", "traits": "Marketing manager, watches YouTube during lunch, cares about professional growth."},
        {"name": "David, 35", "traits": "Millennial dad, watches for home improvement and life hacks, values credibility."},
        {"name": "Ananya, 28", "traits": "Startup founder, avid podcast listener, only shares real value."},
        {"name": "Marco, 31", "traits": "Fitness coach, heavy Instagram user, aspirational content only."},
        {"name": "Elena, 34", "traits": "Remote worker, watches travel logs for escapism, shares wholesome content."},
        {"name": "Kevin, 36", "traits": "Finance professional, watches macro-economics and crypto, loves data-heavy content."},
        {"name": "Jasmine, 27", "traits": "Freelance artist, uses LinkedIn and Instagram, shares creative process videos."},
    ],
    "tech_enthusiasts": [
        {"name": "Alex, 27", "traits": "Full-stack developer, highly critical of technical inaccuracies, shares tutorials."},
        {"name": "Rin, 30", "traits": "AI researcher, trusts technical credibility, loves long-form deep dives."},
        {"name": "Sam, 25", "traits": "Startup founder, watches tech news and product reviews, shares cutting edge info."},
        {"name": "Jordan, 33", "traits": "DevOps engineer, skeptical of hype, vocal in comments."},
        {"name": "Nia, 29", "traits": "UX designer, judges by presentation and clarity, shares innovation content."},
        {"name": "Viktor, 31", "traits": "Hardware modder, loves tinkering videos, shares extreme engineering."},
        {"name": "Sofia, 26", "traits": "Data scientist, follows AI news, shares research summaries."},
    ],
    "corporate_professionals": [
        {"name": "Michael, 45", "traits": "Senior VP, watches LinkedIn, shares polished, data-backed professional content."},
        {"name": "Linda, 38", "traits": "HR Director, shares leadership and workplace culture content."},
        {"name": "James, 52", "traits": "CFO, skeptical of virality, only engages with recognized industry experts."},
        {"name": "Priya, 41", "traits": "Consultant, values case studies, frameworks, and data."},
        {"name": "Robert, 36", "traits": "Sales Director, loves motivational and strategy content."},
        {"name": "Grant, 48", "traits": "Supply Chain executive, watches global logistics news, shares industry trends."},
        {"name": "Susan, 43", "traits": "Legal Counsel, watches compliance and regulatory updates."},
    ],
    "general": [
        {"name": "Aisha, 25", "traits": "Mix of content, scrolls quickly, shares only LMAO or emotional stuff."},
        {"name": "Tom, 40", "traits": "Office worker, commuting viewer, mostly passive."},
        {"name": "Sneha, 31", "traits": "lifestyle and recipe tips, shares with family groups."},
        {"name": "Carlos, 28", "traits": "Entertainment hunter, loves funny and relatable content."},
        {"name": "Emily, 22", "traits": "Aesthetic lover, shares emotionally resonant content."},
        {"name": "Arthur, 65", "traits": "Retired teacher, watches news and nature documentaries, rarely shares."},
        {"name": "Molly, 17", "traits": "High school student, music and fan-edits, shares constantly."},
    ],
}

PLATFORM_CONTEXT = {
    "youtube": "YouTube where videos can be long-form. Audience skips non-engaging intros. Thumbnails and the first 30 seconds are crucial.",
    "tiktok": "TikTok where the first 2-3 seconds are everything. If the hook isn't immediate, the video is scrolled past. Short, punchy, and trend-aware content wins.",
    "instagram": "Instagram Reels where aesthetics and visual quality matter enormously. Emotional connection and shareable moments drive virality.",
    "twitter": "Twitter (X) where the quality of the written hook determines whether someone clicks. Controversial or unique takes get amplified.",
}

CONTENT_TYPE_TIPS = {
    "educational": "Educational content needs to promise a clear, actionable takeaway within the first 5 seconds.",
    "entertainment": "Entertainment content must trigger an emotion (laughter, surprise, awe) almost instantly.",
    "news": "News content needs to communicate urgency and uniqueness to break through the noise.",
    "marketing": "Marketing content must not feel like an ad. Value-first approach is essential.",
    "vlog": "Vlog content relies on the creator's personality and relatability to hook viewers.",
}


def _build_simulation_prompt(script: str, audience: str, platform: str, content_type: str) -> str:
    personas = AUDIENCE_PERSONAS.get(audience, AUDIENCE_PERSONAS["general"])
    platform_ctx = PLATFORM_CONTEXT.get(platform, PLATFORM_CONTEXT["youtube"])
    content_tip = CONTENT_TYPE_TIPS.get(content_type, "")
    
    personas_text = "\n".join([f"- **{p['name']}**: {p['traits']}" for p in personas])

    return f"""You are a world-class content strategy AI. You will simulate how 5 different audience agents react to a piece of content and generate a detailed virality prediction report.

## Platform Context
The content is being published on **{platform.upper()}**: {platform_ctx}

## Content Type
This is a **{content_type}** piece. Key note: {content_tip}

## The Content Script / Idea
---
{script}
---

## Simulated Audience Agents
These 10 agents represent the target audience segment "{audience}". Simulate each agent's honest reaction:
{personas_text}

## Your Task
Analyze the script deeply and return a JSON object with the following structure. Be critical, nuanced, and realistic. Do NOT be overly positive.

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{{
  "virality_score": <integer 0-100>,
  "share_probability": <float 0.0-1.0>,
  "estimated_retention": <float 0.0-1.0>,
  "like_to_view_ratio": <float 0.0-1.0>,
  "sentiment_breakdown": {{"positive": <int>, "negative": <int>, "neutral": <int>}},
  "hook_strength": <integer 0-10>,
  "audience_match": <integer 0-10>,
  "platform_fit": <integer 0-10>,
  "agent_feedback": [
    {{
      "agent_name": "<name>",
      "persona": "<one-line description>",
      "sentiment": "<positive|negative|neutral>",
      "reaction": "<2-3 sentences of the agent's honest internal monologue about the content>",
      "would_share": <true|false>
    }}
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": [
    {{"issue": "<issue>", "suggestion": "<concrete actionable fix>"}},
    {{"issue": "<issue>", "suggestion": "<concrete actionable fix>"}}
  ],
  "overall_verdict": "<2-3 sentence overall verdict on whether this content will go viral and why>",
  "improvement_summary": "<3-4 sentence summary of the most impactful changes the creator should make>"
}}

The sentiment_breakdown values must sum to exactly 100. Be strict and realistic in scoring.
"""


def _parse_llm_response(content: str) -> dict:
    """Safely parse LLM JSON response, stripping markdown fences if present."""
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        # Strip first and last fence lines
        content = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    return json.loads(content)


async def run_virality_simulation(
    script: str,
    audience: str,
    platform: str,
    content_type: str,
) -> ViralityReport:
    """
    Core simulation function.
    Calls LLM to simulate audience reaction and returns a ViralityReport.
    """
    if not settings.LLM_API_KEY:
        raise ValueError("LLM_API_KEY is not configured. Please set it in the .env file.")

    client = OpenAI(
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_BASE_URL,
    )

    prompt = _build_simulation_prompt(script, audience, platform, content_type)

    logger.info(f"Starting virality simulation | audience={audience} platform={platform}")

    response = client.chat.completions.create(
        model=settings.LLM_MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "You are a precise content virality analysis AI. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.75,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = _parse_llm_response(raw)

    # Build structured response
    agent_feedback = [
        AgentFeedback(
            agent_name=af["agent_name"],
            persona=af["persona"],
            sentiment=af["sentiment"],
            reaction=af["reaction"],
            would_share=af["would_share"],
        )
        for af in data.get("agent_feedback", [])
    ]

    weaknesses = [
        WeaknessItem(issue=w["issue"], suggestion=w["suggestion"])
        for w in data.get("weaknesses", [])
    ]

    report = ViralityReport(
        virality_score=int(data.get("virality_score", 50)),
        share_probability=float(data.get("share_probability", 0.3)),
        estimated_retention=float(data.get("estimated_retention", 0.4)),
        like_to_view_ratio=float(data.get("like_to_view_ratio", 0.05)),
        sentiment_breakdown=data.get("sentiment_breakdown", {"positive": 33, "negative": 33, "neutral": 34}),
        hook_strength=int(data.get("hook_strength", 5)),
        audience_match=int(data.get("audience_match", 5)),
        platform_fit=int(data.get("platform_fit", 5)),
        agent_feedback=agent_feedback,
        strengths=data.get("strengths", []),
        weaknesses=weaknesses,
        overall_verdict=data.get("overall_verdict", ""),
        improvement_summary=data.get("improvement_summary", ""),
    )

    logger.info(f"Simulation complete | virality_score={report.virality_score}")
    return report


async def run_ab_test(
    script_a: str,
    script_b: str,
    audience: str,
    platform: str,
) -> ABTestReport:
    """
    Runs virality simulation on two scripts and compares them.
    """
    import asyncio
    
    report_a, report_b = await asyncio.gather(
        run_virality_simulation(script_a, audience, platform, "entertainment"),
        run_virality_simulation(script_b, audience, platform, "entertainment"),
    )

    if report_a.virality_score > report_b.virality_score + 5:
        winner = "A"
    elif report_b.virality_score > report_a.virality_score + 5:
        winner = "B"
    else:
        winner = "tie"

    score_diff = abs(report_a.virality_score - report_b.virality_score)
    if winner == "tie":
        comparison = f"Both scripts are closely matched with a score difference of only {score_diff} points. Focus on the individual improvement suggestions for whichever fits your style better."
    else:
        winning_score = report_a.virality_score if winner == "A" else report_b.virality_score
        losing_score = report_b.virality_score if winner == "A" else report_a.virality_score
        comparison = f"Version {winner} clearly outperforms the other with a virality score of {winning_score} vs {losing_score}. The key differentiator is likely the hook strength and audience alignment."

    return ABTestReport(
        winner=winner,
        version_a=report_a,
        version_b=report_b,
        comparison_summary=comparison,
    )
