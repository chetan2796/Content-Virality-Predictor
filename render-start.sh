#!/bin/bash
# Start script for Render
# Run from the root of the project
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
