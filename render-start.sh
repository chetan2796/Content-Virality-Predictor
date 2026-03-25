#!/bin/bash
# Start script for Render/HuggingFace
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 10000
