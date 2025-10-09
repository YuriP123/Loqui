#!/bin/bash

echo "🚀 Starting AI Voice Clone Studio - Complete System"
echo "===================================================="
echo ""

# Function to check if a service is running
check_service() {
    local service=$1
    local check_command=$2
    
    echo -n "Checking $service... "
    if eval $check_command > /dev/null 2>&1; then
        echo "✅ Running"
        return 0
    else
        echo "❌ Not running"
        return 1
    fi
}

# Check prerequisites
echo "📋 Checking Prerequisites"
echo "-------------------------"

check_service "Virtual Environment" "[[ -n \$VIRTUAL_ENV ]]"
if [ $? -ne 0 ]; then
    echo "⚠️  Please activate virtual environment: source venv/bin/activate"
    exit 1
fi

check_service "PostgreSQL" "pg_isready -q"
if [ $? -ne 0 ]; then
    echo "⚠️  Please start PostgreSQL: brew services start postgresql@15"
    exit 1
fi

check_service "Redis" "redis-cli ping"
if [ $? -ne 0 ]; then
    echo "⚠️  Please start Redis: brew services start redis"
    exit 1
fi

echo ""

# Start Celery Worker
echo "🔧 Starting Celery Worker..."
celery -A app.celery_app worker --loglevel=info --logfile=logs/celery.log &
CELERY_PID=$!
echo "Celery Worker PID: $CELERY_PID"
sleep 3

# Start Celery Beat (optional - for periodic tasks)
# echo "⏰ Starting Celery Beat..."
# celery -A app.celery_app beat --loglevel=info &
# CELERY_BEAT_PID=$!

echo ""

# Start FastAPI
echo "🌐 Starting FastAPI Server..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo "   WebSocket: ws://localhost:8000/api/ws/{user_id}?token=YOUR_TOKEN"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap to cleanup on exit
trap 'echo ""; echo "🛑 Stopping services..."; kill $CELERY_PID 2>/dev/null; exit' INT TERM

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
