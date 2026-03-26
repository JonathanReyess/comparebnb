#!/bin/bash
cd "$(dirname "$0")"

if ! command -v uvicorn &>/dev/null; then
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
fi

echo "Starting CompareBnB API on http://localhost:8000"
uvicorn main:app --reload --port 8000
