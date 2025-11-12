#!/bin/bash

# Complete system startup script
# This script starts the FastAPI server and Celery worker

set -e  # Exit on error

echo "🚀 Starting Complete Voice Clone System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to backend directory
cd "$(dirname "$0")/.."

# Check if Redis is running
echo "🔍 Checking Redis..."
if ! redis-cli ping &> /dev/null; then
    echo -e "${RED}❌ Redis is not running!${NC}"
    echo "Starting Redis..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start redis
        sleep 2
    else
        sudo systemctl start redis
        sleep 2
    fi
    
    if ! redis-cli ping &> /dev/null; then
        echo -e "${RED}❌ Failed to start Redis. Please start it manually.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Redis is running${NC}"

# Check if PostgreSQL is accessible
echo ""
echo "🔍 Checking PostgreSQL..."
if ! psql -U voiceclone_user -d voiceclone_db -c "SELECT 1;" &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL connection failed${NC}"
    echo "Make sure PostgreSQL is running and credentials are correct"
    echo "DATABASE_URL: $DATABASE_URL"
else
    echo -e "${GREEN}✅ PostgreSQL is accessible${NC}"
fi

# Check if virtual environment is activated
echo ""
echo "🔍 Checking Python virtual environment..."
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not activated${NC}"
    if [ -d "venv" ]; then
        echo "Activating venv..."
        source venv/bin/activate
    elif [ -d "../venv" ]; then
        echo "Activating ../venv..."
        source ../venv/bin/activate
    else
        echo -e "${RED}❌ No virtual environment found. Please create one:${NC}"
        echo "   python -m venv venv"
        echo "   source venv/bin/activate"
        echo "   pip install -r requirements.txt"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Virtual environment: $VIRTUAL_ENV${NC}"

# Check if .env file exists
echo ""
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from config defaults...${NC}"
    cat > .env << 'EOF'
DATABASE_URL=postgresql://voiceclone_user:voiceclone_pass@localhost:5432/voiceclone_db
FRONTEND_URL=http://localhost:3000
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
REPLICATE_API_TOKEN=
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Kill any existing processes on the ports
echo ""
echo "🧹 Cleaning up old processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 1

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Starting FastAPI Server (port 8000)"
echo "════════════════════════════════════════════════════════"
echo ""

# Start FastAPI in background
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/fastapi.log 2>&1 &
FASTAPI_PID=$!

# Wait for FastAPI to start
echo "⏳ Waiting for FastAPI to start..."
sleep 3

if curl -s http://localhost:8000/docs > /dev/null; then
    echo -e "${GREEN}✅ FastAPI is running (PID: $FASTAPI_PID)${NC}"
    echo "   📖 API Docs: http://localhost:8000/docs"
else
    echo -e "${RED}❌ FastAPI failed to start${NC}"
    echo "Check logs at: /tmp/fastapi.log"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Starting Celery Worker"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📝 Celery will process audio generation tasks"
echo "   Mode: ${REPLICATE_API_TOKEN:-MOCK AI (no Replicate token)}"
echo ""

# Start Celery in foreground (so we can see logs)
celery -A app.celery_app.celery_app worker -l info

# If we get here, Celery was stopped
echo ""
echo -e "${YELLOW}🛑 Celery worker stopped${NC}"
echo "Cleaning up..."

# Kill FastAPI
kill $FASTAPI_PID 2>/dev/null || true

echo -e "${GREEN}✅ System shutdown complete${NC}"

