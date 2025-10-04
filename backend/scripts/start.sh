#!/bin/bash

echo "🚀 Starting AI Voice Clone Studio Backend..."
echo ""

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "⚠️  Virtual environment not activated!"
    echo "Run: source venv/bin/activate"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running!"
    echo "Start it with: brew services start postgresql@15"
    exit 1
fi

# Check if database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw voiceclone_db; then
    echo "⚠️  Database 'voiceclone_db' not found!"
    echo "Create it with: createdb voiceclone_db"
    exit 1
fi

echo "✅ Environment checks passed"
echo ""
echo "📊 Starting FastAPI server..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
