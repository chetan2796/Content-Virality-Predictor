# Product Requirements Document (PRD): Content Virality Predictor (CVP)

## 1. Executive Summary
**Content Virality Predictor (CVP)** is an AI-powered simulation engine designed for content creators (YouTube, TikTok, Instagram) and marketing teams. Unlike traditional analytics tools that provide data *after* a video is posted, CVP allows users to test their scripts and ideas in a **Digital Sandbox** before they even hit "Upload."

By leveraging **Swarm Intelligence** and **Multi-Agent Simulation** (built on the MiroFish framework), CVP predicts how specific audience segments will react, engage, and share content, providing a "Virality Score" and actionable feedback to improve performance.

---

## 2. Problem Statement
### 2.1 The "Post and Pray" Problem
Creators currently invest massive amounts of time (10-50 hours per video) and money into production with zero certainty of success.
*   **Analytics are Retroactive:** Tools like VidIQ or YouTube Analytics only show what went wrong *after* the opportunity is lost.
*   **Subjective Bias:** Creators often think their hook is great, but it may not resonate with the actual target demographic.
*   **High Failure Rate:** Over 90% of content fails to reach its intended audience due to poor timing, weak hooks, or lack of "sharability."

---

## 3. Target Audience
| Segment | Use Case |
|---------|----------|
| **Independent Creators** | YouTubers and TikTokers looking to optimize hooks and retain viewers. |
| **Marketing Agencies** | Testing ad copy and short-form video concepts for clients. |
| **Media Houses** | Rapidly prototyping news segments or viral trend responses. |
| **Political/PR Teams** | Simulating public reaction to sensitive policy announcements or statements. |

---

## 4. Core Features (MVP)

### 4.1. Simulation-based Virality Score
*   **Input:** Users upload a video script, a description of the hook, or a thumbnail mockup.
*   **Process:** The MiroFish engine spawns 500+ AI agents (Persona-based) that represent a specific demographic.
*   **Metric:** Predicts "Share Probability," "Like-to-View Ratio," and "Estimated Retention."

### 4.2. Audience Persona Selection
Users can configure the "Digital Sandbox" by selecting audience archetypes:
*   **Gen Z / Alpha (Trend-focused)**
*   **Tech Enthusiasts / Developers**
*   **Corporate Professionals**
*   **Location-based** (e.g., Tier 1 India, US Urban, etc.)

### 4.3. "Why It Flops" — Agent Feedback Logs
Instead of just a score, users can read the **Internal Monologue** of simulated agents:
*   *"The first 5 seconds didn't grab me, I kept scrolling."*
*   *"This feels too much like an ad; I don't trust the creator."*
*   *"I would share this with my friends because it's relatable."*

### 4.4. A/B Script Testing
*   Upload two versions of a script or hook.
*   The simulator runs them in parallel against the same audience.
*   Identifies which version has the higher "Virality Alpha."

---

## 5. User Journey
1.  **Drafting:** User pastes their script or describes their video idea in the CVP dashboard.
2.  **Configuration:** User selects the target audience (e.g., "18-24, interested in Gaming and AI").
3.  **Simulation:** The engine initializes the MiroFish Multi-Agent environment. In < 60 seconds, agents interact with the "Seed" content.
4.  **Reporting:** User receives a comprehensive PDF report with the Virality Score, sentiment heatmaps, and improvement suggestions.

---

## 6. Technical Architecture (Leveraging MiroFish)

### 6.1. Backend (The Engine)
*   **Framework:** Python / FastAPI.
*   **Simulation Core:** **OASIS** (Open Agent Social Interaction Simulations) integrated via MiroFish services.
*   **LLM Orchestration:** Gemini 1.5 Pro for agent reasoning and report generation.
*   **Memory Management:** Zep Memory for maintaining long-term agent personalities.

### 6.2. Frontend (The Interface)
*   **Stack:** Next.js, Tailwind CSS.
*   **Interaction:** A "God's Eye View" dashboard showing agents interacting with the content in real-time (mimicking a social feed).

---

## 7. Monetization Strategy
1.  **Free Tier:** 3 simulations per month (General Audience only).
2.  **Pro Tier ($29/mo):** Unlimited simulations, Advanced Personas, A/B testing.
3.  **Enterprise:** Custom audience creation (importing brand's real follower data to create high-fidelity twins).

---

## 8. Roadmap
*   **Phase 1 (MVP):** Script-to-Virality simulation for Twitter (X) and Reddit platforms.
*   **Phase 2:** Video frame analysis (analyzing thumbnails and first 3 seconds of footage).
*   **Phase 3:** Real-time trend integration (Simulator agents stay updated with today's real-world news).

---
*Created by Antigravity AI - March 2026*
