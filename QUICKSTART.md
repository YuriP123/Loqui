# 🚀 Quick Start Guide

## Prerequisites (One-time setup)

1. **Install Redis** (if not already installed):
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Ubuntu
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. **Verify Redis is running**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Create backend .env file** (if it doesn't exist):
   ```bash
   cd backend
   cat > .env << 'EOF'
   DATABASE_URL=postgresql://voiceclone_user:voiceclone_pass@localhost:5432/voiceclone_db
   FRONTEND_URL=http://localhost:3000
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0
   REPLICATE_API_TOKEN=
   EOF
   ```

---

## Running the Application (Every time)

### Option 1: Use the All-in-One Script (Recommended)

**Terminal 1** - Backend (API + Celery):
```bash
cd backend
source venv/bin/activate
./scripts/start_complete_system.sh
```

**Terminal 2** - Frontend:
```bash
cd loqui
npm run dev
```

### Option 2: Manual Start (3 Terminals)

**Terminal 1** - Backend API:
```bash
cd backend
source venv/bin/activate
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"  # macOS only
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2** - Celery Worker:
```bash
cd backend
source venv/bin/activate
celery -A app.celery_app.celery_app worker -l info
```

**Terminal 3** - Frontend:
```bash
cd loqui
npm run dev
```

---

## ✅ Verify Everything is Running

1. **Backend API**: http://localhost:8000/docs (should show API docs)
2. **Frontend**: http://localhost:3000 (should show landing page)
3. **Redis**: Run `redis-cli ping` (should return PONG)
4. **Celery**: Check Terminal 2 for "ready" message

---

## 🎯 Test the Complete Workflow

1. **Sign Up**: http://localhost:3000 → Click "Sign Up"
2. **Upload Voice Sample**: Go to "My Voices" → Upload an MP3/WAV file
3. **Generate Audio**: Go to "Lab" → Select sample → Enter script → Generate
4. **View Results**: Check "Generations" or "Home" page
5. **Delete**: Click delete on any generation or sample

---

## 🔍 Troubleshooting

### Generation stuck in "pending"?
- ✅ Check Celery worker is running (Terminal 2)
- ✅ Check Redis: `redis-cli ping`

### Can't delete generations?
- ✅ Refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- ✅ Check browser console for errors (F12)

### "Connection to Redis lost"?
```bash
brew services restart redis  # macOS
sudo systemctl restart redis  # Ubuntu
```

### Backend won't start?
```bash
# Make sure you're in backend/ directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Check if all dependencies are installed
pip install -r requirements.txt
```

---

## 📊 What's Running Where?

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8000 | http://localhost:8000 |
| API Docs | 8000 | http://localhost:8000/docs |
| PostgreSQL | 5432 | localhost |
| Redis | 6379 | localhost |

---

## 🎙️ AI Voice Generation

### Using MOCK AI (Default)
- No API key needed
- Fast generation (2-10 seconds)
- Copies input sample as output (for testing)

### Using REAL AI (Replicate)
1. Sign up at [replicate.com](https://replicate.com)
2. Get API token: https://replicate.com/account/api-tokens
3. Add to `backend/.env`:
   ```
   REPLICATE_API_TOKEN=r8_...your_token_here...
   ```
4. Restart backend and Celery

---

## 🛑 Stopping the Application

**Option 1** (All-in-One Script):
- Press `Ctrl+C` in Terminal 1 (backend)
- Press `Ctrl+C` in Terminal 2 (frontend)

**Option 2** (Manual):
- Press `Ctrl+C` in all 3 terminals

---

## 📝 Common Commands

```bash
# Check Redis status
redis-cli ping

# Check PostgreSQL
psql -U voiceclone_user -d voiceclone_db -c "SELECT 1;"

# View backend logs
tail -f /tmp/fastapi.log

# Clear Redis cache
redis-cli FLUSHALL

# Reset database
cd backend
alembic downgrade base
alembic upgrade head
```

---

## 🎉 Success Checklist

- [ ] Backend API responds at http://localhost:8000/docs
- [ ] Frontend loads at http://localhost:3000
- [ ] Can create account and login
- [ ] Can upload voice sample
- [ ] Sample shows "ready" status
- [ ] Can create generation in Lab
- [ ] Generation completes (pending → processing → completed)
- [ ] Can play generated audio
- [ ] Can delete generations

---

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

