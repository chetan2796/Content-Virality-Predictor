# ⚡ Content Virality Predictor (CVP)

**"Know if your video will go viral BEFORE you hit Upload."**

Content Virality Predictor is an AI-powered simulation engine that takes your video script or content idea and tests it against a **Digital Sandbox** of thousands of intelligent audience agents. Powered by multi-agent swarm intelligence (inspired by MiroFish), CVP provides a detailed virality report, share probability, and actionable AI feedback.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- An OpenAI-compatible API Key (Gemini, OpenAI, etc.)

### 2. Setup
```bash
# Clone the repository (or navigate to the project folder)
cd Content-Virality-Predictor

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Configuration
1. Open the `.env` file in the root directory.
2. Enter your `LLM_API_KEY`.
3. (Optional) Adjust the `LLM_BASE_URL` and `LLM_MODEL_NAME` to your preferred provider.

### 4. Run the Application
```bash
# Using the provided start script
./start.sh

# OR manually
cd backend
python3 run.py
```

### 5. Access the UI
Open `frontend/index.html` in your favorite web browser.

---

## 🛠️ Features

- **Single Script Simulation:** Get a full virality report for your video idea.
- **A/B Testing:** Compare two different scripts or hooks to see which one performs better.
- **Audience Archetypes:** Select from Gen Z, Millennials, Tech Enthusiasts, Corporate Professionals, or a General audience.
- **Agent Feedback Logs:** Read the internal monologues of AI agents reacting to your content.
- **Actionable Improvements:** Get concrete suggestions on how to fix weak hooks or improve retention.

---

## 📂 Project Structure

- `backend/`: FastAPI server and AI simulation engine.
- `frontend/`: Premium dark-themed UI (HTML/CSS/JS).
- `PRD.pdf`: The complete Product Requirements Document.
- `start.sh`: Convenient one-click startup script.

---

## ⚙️ How it Works

The engine uses **Large Language Models (LLMs)** to instantiate multiple "Agent Personas." 
1. **The Script** is fed into the simulation.
2. **Agents** evaluate the content based on their specific traits (e.g., "Short attention span," "Skeptical of brands").
3. **Interactions** (Likes, Shares, Comments) are simulated.
4. **Data** is aggregated into a final **Virality Score**.

---
*Developed for the Future of Content Creation.*
