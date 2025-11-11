# 🚀 Loqui Backend - Quick Start Guide

## ⚡ Start the Complete System

```bash
cd backend
source venv/bin/activate
env -u DEBUG ./scripts/start_all.sh
```

## 🔗 Access Points

| Service            | URL                                             | Purpose              |
| ------------------ | ----------------------------------------------- | -------------------- |
| API Root           | http://localhost:8000/                          | API information      |
| Health Check       | http://localhost:8000/health                    | System status        |
| API Docs (Swagger) | http://localhost:8000/docs                      | Interactive API docs |
| API Docs (ReDoc)   | http://localhost:8000/redoc                     | Alternative docs     |
| AI Service Info    | http://localhost:8000/api/monitoring/ai-service | AI status            |

## 🧪 Quick Test

```bash
# Test API
curl http://localhost:8000/health | python3 -m json.tool

# Run test suite
pytest tests/ -v

# Test AI generation workflow
./scripts/test_replicate_generation.sh
```

## 🔐 Quick Security Fix (REQUIRED for Production)

```bash
# 1. Generate secure SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Update .env file
nano .env
# Set: SECRET_KEY=<generated_key>
# Set: DEBUG=False
```

## 📝 Key Files

| File                      | Purpose                  |
| ------------------------- | ------------------------ |
| `app/main.py`             | Application entry point  |
| `app/config.py`           | Configuration settings   |
| `.env`                    | Environment variables    |
| `requirements.txt`        | Python dependencies      |
| `PRODUCTION_CHECKLIST.md` | Pre-deployment checklist |

## ⚙️ Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db_name
SECRET_KEY=your-secret-key-here
REPLICATE_API_TOKEN=r8_your_token

# Optional
DEBUG=False
FRONTEND_URL=https://yourdomain.com
MAX_FILE_SIZE=10485760
```

## 🎯 Common Commands

```bash
# Start backend only
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Test specific module
pytest tests/api/test_auth.py -v

# Check dependencies
pip list

# Update dependencies
pip install -r requirements.txt
```

## 📊 System Status

**Current Version:** 2.0.0  
**Status:** ✅ Production Ready (with security fixes)  
**Test Coverage:** 100% (13/13 passing)

## 🆘 Troubleshooting

### Port Already in Use

```bash
lsof -ti:8000 | xargs kill -9
```

### Redis Not Running

```bash
brew services start redis
```

### PostgreSQL Not Running

```bash
brew services start postgresql@15
```

### Celery Worker Issues

```bash
ps aux | grep celery | grep -v grep | awk '{print $2}' | xargs kill -9
```

## 📚 Documentation

- Full checklist: `PRODUCTION_CHECKLIST.md`
- API docs: `API_DOCUMENTATION.md`
- Project README: `README.md`

---

**Last Updated:** October 4, 2025  
**Maintained by:** Development Team
