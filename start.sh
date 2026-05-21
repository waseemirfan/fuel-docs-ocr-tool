#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$PROJECT_DIR/venv"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
FRONTEND_DIST="$FRONTEND_DIR/dist"
DB_FILE="$BACKEND_DIR/app.db"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  FuelDocs OCR Tool - Setup & Launch"
echo "=========================================="
echo ""

# Check Python
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python 3 not found.${NC}"
    echo "Please install Python 3.10+ from https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"
echo ""

# Create venv if needed
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate venv
source "$VENV_DIR/bin/activate"
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Install/upgrade pip
echo "Updating pip..."
pip install --quiet --upgrade pip setuptools wheel
echo -e "${GREEN}✓ pip updated${NC}"

# Install dependencies
echo "Installing Python dependencies..."
cd "$BACKEND_DIR"
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create .env if missing
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "Creating .env configuration file..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo -e "${YELLOW}⚠ Generated .env file${NC}"
    echo -e "  Edit $BACKEND_DIR/.env to add your LLM API keys"
fi
echo ""

# Initialize DB
echo "Initializing database..."
cd "$BACKEND_DIR"
python3 << 'PYEOF'
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import asyncio
from app.database import init_db
asyncio.run(init_db())
print("✓ Database ready")
PYEOF
echo ""

# Start services
echo "=========================================="
echo -e "${GREEN}Starting FuelDocs OCR Tool...${NC}"
echo "=========================================="
echo ""
echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}FIRST TIME SETUP:${NC}"
echo "1. Open: http://localhost:5173"
echo "2. Go to Settings page"
echo "3. Select LLM Provider (Google Gemini recommended - free)"
echo "4. Paste your API key from https://aistudio.google.com/apikey"
echo "5. Start uploading documents!"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start backend
cd "$BACKEND_DIR"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Serve frontend (production build)
cd "$FRONTEND_DIST"
python3 -m http.server 5173 &
FRONTEND_PID=$!

# Handle cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Services stopped.'" INT TERM EXIT

# Keep script running
wait
