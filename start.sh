#!/bin/bash
# ─────────────────────────────────────────────
# Content Virality Predictor — Start Script
# ─────────────────────────────────────────────

echo "⚡ Starting Content Virality Predictor..."

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠  .env file not found. Copying from .env.example..."
  cp .env.example .env
  echo "📝 Please edit .env and set your LLM_API_KEY, then run this script again."
  exit 1
fi

# Start API server
echo "🚀 Starting FastAPI backend on http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/api/docs"
echo "🌐 Frontend: Open frontend/index.html in your browser"
echo ""
cd backend && python3 run.py