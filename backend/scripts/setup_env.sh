#!/bin/bash

# Setup script for backend environment

echo "🔧 Setting up backend environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Backend Environment Configuration

# DATABASE
DATABASE_URL=postgresql://voiceclone_user:voiceclone_pass@localhost:5432/voiceclone_db

# JWT AUTHENTICATION
SECRET_KEY=your-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# FRONTEND URL (for CORS)
FRONTEND_URL=http://localhost:3000

# REDIS & CELERY
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# AI SERVICE - REPLICATE
# Get your API token at: https://replicate.com/account/api-tokens
# Leave blank to use MOCK AI for testing
REPLICATE_API_TOKEN=

# Model to use
REPLICATE_MODEL=resemble-ai/chatterbox

# FILE STORAGE
UPLOAD_DIR=./app/storage
MAX_FILE_SIZE=10485760

# APPLICATION
APP_NAME=AI Voice Clone Studio API
DEBUG=True
EOF
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists, skipping..."
fi

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo ""
    echo "❌ Redis is not installed!"
    echo "📦 Install Redis:"
    echo "   macOS:  brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-server"
    echo ""
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo ""
    echo "⚠️  Redis is not running!"
    echo "🚀 Start Redis:"
    echo "   macOS:  brew services start redis"
    echo "   Ubuntu: sudo systemctl start redis"
    echo ""
    echo "Starting Redis now..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start redis
    else
        sudo systemctl start redis
    fi
fi

# Verify Redis is working
if redis-cli ping &> /dev/null; then
    echo "✅ Redis is running"
else
    echo "❌ Failed to start Redis"
    exit 1
fi

echo ""
echo "✅ Backend environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update DATABASE_URL in .env if needed"
echo "   2. (Optional) Add REPLICATE_API_TOKEN in .env for real AI"
echo "   3. Run: python -m alembic upgrade head"
echo "   4. Start API: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "   5. Start Celery: celery -A app.celery_app.celery_app worker -l info"
echo ""

