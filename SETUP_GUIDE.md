# Complete Setup Guide - Loqui Voice Clone System

This guide will walk you through setting up the complete full-stack application from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Running the Application](#running-the-application)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

- **Python 3.10+** (for backend)
- **Node.js 18+** and npm (for frontend)
- **PostgreSQL 15+** (database)
- **Redis** (for background task queue)

### Install Prerequisites

#### macOS (using Homebrew)

```bash
# Install Python (if not already installed)
brew install python@3.11

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Redis
brew install redis
brew services start redis

# Install Node.js
brew install node
```

#### Ubuntu/Debian

```bash
# Python
sudo apt-get update
sudo apt-get install python3.11 python3.11-venv python3-pip

# PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Redis
sudo apt-get install redis-server
sudo systemctl start redis

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 🔙 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup PostgreSQL Database

```bash
# Start PostgreSQL (if not running)
# macOS:
brew services start postgresql@15

# Ubuntu:
sudo systemctl start postgresql

# Create database and user
psql postgres << EOF
CREATE DATABASE voiceclone_db;
CREATE USER voiceclone_user WITH PASSWORD 'voiceclone_pass';
GRANT ALL PRIVILEGES ON DATABASE voiceclone_db TO voiceclone_user;
ALTER DATABASE voiceclone_db OWNER TO voiceclone_user;
\c voiceclone_db
GRANT ALL ON SCHEMA public TO voiceclone_user;
EOF
```

### 5. Create Environment File

Create `.env` in the `backend/` directory:

```bash
# backend/.env
DATABASE_URL=postgresql://voiceclone_user:voiceclone_pass@localhost:5432/voiceclone_db
FRONTEND_URL=http://localhost:3000
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
REPLICATE_API_TOKEN=
```

**Note:** Leave `REPLICATE_API_TOKEN` blank to use MOCK AI for testing. To use real AI:
1. Sign up at [replicate.com](https://replicate.com)
2. Get your API token from [account settings](https://replicate.com/account/api-tokens)
3. Add it to `.env`

### 6. Run Database Migrations

```bash
# Make sure you're in the backend directory with venv activated
alembic upgrade head
```

### 7. Verify Redis is Running

```bash
redis-cli ping
# Should return: PONG
```

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd loqui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create `.env.local` in the `loqui/` directory:

```bash
# loqui/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 🚀 Running the Application

You'll need **3 terminal windows** for the complete system:

### Terminal 1: Backend API Server

```bash
cd backend
source venv/bin/activate
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"  # macOS only
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:** Visit http://localhost:8000/docs (you should see API documentation)

### Terminal 2: Celery Worker (Background Tasks)

```bash
cd backend
source venv/bin/activate
celery -A app.celery_app.celery_app worker -l info
```

**What this does:** Processes audio generation requests in the background

### Terminal 3: Frontend Development Server

```bash
cd loqui
npm run dev
```

**Verify:** Visit http://localhost:3000 (you should see the landing page)

---

## 🎯 Quick Start Script (All-in-One)

Alternatively, use the provided script to start backend services:

```bash
cd backend
./scripts/start_complete_system.sh
```

This will start both the FastAPI server and Celery worker. Then in another terminal:

```bash
cd loqui
npm run dev
```

---

## 🧪 Testing the Complete Workflow

### 1. Create an Account

1. Go to http://localhost:3000
2. Click **Sign Up**
3. Fill in username, email, password
4. Click **Create Account**

### 2. Upload a Voice Sample

1. After sign in, go to **My Voices**
2. Click **Upload File** or **Record**
3. Upload an MP3/WAV file (at least 3 seconds, clear audio)
4. Wait for "processing" → "ready" status

### 3. Generate AI Voice

1. Go to **Lab**
2. Select your uploaded voice sample
3. Enter a title (e.g., "Test Generation")
4. Enter script text (e.g., "Hello, this is a test of AI voice generation")
5. Review and click **Complete**
6. Wait for generation (status: pending → processing → completed)
7. Play the generated audio

### 4. View and Manage

- **Home**: See recent generations and stats
- **Generations**: View all generations, delete unwanted ones
- **My Voices**: Manage voice samples

---

## 🔍 Troubleshooting

### Issue: "Connection to Redis lost"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start it:
# macOS:
brew services start redis

# Ubuntu:
sudo systemctl start redis
```

### Issue: "ModuleNotFoundError: No module named 'app'"

**Solution:**
```bash
# Make sure you're in the backend directory
cd backend
source venv/bin/activate
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Check if PostgreSQL is running
psql -U voiceclone_user -d voiceclone_db -c "SELECT 1;"

# If connection fails, check:
# 1. Is PostgreSQL running?
brew services list  # macOS
sudo systemctl status postgresql  # Ubuntu

# 2. Are credentials correct in .env?
cat .env | grep DATABASE_URL

# 3. Does the database exist?
psql postgres -c "\l" | grep voiceclone_db
```

### Issue: "Cannot delete generations"

**Solution:**
- Frontend now uses correct `audio_id` field
- Refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
- Check browser console for errors (F12)

### Issue: "Generation stuck in 'pending' status"

**Solution:**
- Make sure **Celery worker is running** (Terminal 2)
- Check Celery logs for errors
- Verify Redis connection: `redis-cli ping`

### Issue: "422 Unprocessable Entity" on login

**Solution:**
- Backend expects `application/x-www-form-urlencoded` for login
- This is already fixed in the frontend code
- Clear browser cache and try again

### Issue: "Frontend can't connect to backend"

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:8000/

# 2. Check CORS settings
# In backend/app/config.py, verify FRONTEND_URL=http://localhost:3000

# 3. Check frontend .env.local
cat loqui/.env.local
# Should have: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│                    http://localhost:3000                 │
└───────────────────┬────────────┬────────────────────────┘
                    │            │
                    │ HTTP       │ WebSocket
                    │            │
┌───────────────────▼────────────▼────────────────────────┐
│              Backend API (FastAPI)                       │
│              http://localhost:8000                       │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
       │ SQL          │ Task Queue   │ File Storage
       │              │              │
┌──────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
│ PostgreSQL  │ │  Redis   │ │   Celery    │
│  :5432      │ │  :6379   │ │   Worker    │
└─────────────┘ └──────────┘ └─────────────┘
                                     │
                                     │ AI API
                                     ▼
                              ┌─────────────┐
                              │  Replicate  │
                              │  (optional) │
                              └─────────────┘
```

---

## 🎓 Development Notes

### Backend Technologies
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database
- **Alembic**: Database migrations
- **Celery**: Async task queue
- **Redis**: Message broker
- **JWT**: Authentication tokens
- **Replicate**: AI voice generation API

### Frontend Technologies
- **Next.js 14**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS
- **Shadcn/ui**: Component library
- **Native fetch API**: HTTP client

### Key Features Implemented
✅ User authentication (JWT)
✅ Voice sample upload & recording
✅ Audio generation with status polling
✅ Real-time WebSocket updates
✅ Library management
✅ Delete generations & samples
✅ Mock AI (for testing without API costs)
✅ Real AI integration (Replicate)

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user

### Voice Samples
- `POST /api/samples/upload` - Upload sample
- `GET /api/samples/` - List samples
- `GET /api/samples/{id}` - Get sample
- `DELETE /api/samples/{id}` - Delete sample

### Generations
- `POST /api/generation/create` - Start generation
- `GET /api/generation/status/{id}` - Check status
- `GET /api/generation/` - List generations
- `GET /api/generation/{id}` - Get generation
- `DELETE /api/generation/{id}` - Delete generation

### Library
- `GET /api/library/samples` - All samples
- `GET /api/library/download/sample/{id}` - Stream sample
- `GET /api/library/download/generated/{id}` - Stream generated audio

---

## 🔐 Security Notes

### Development
- Default `SECRET_KEY` is insecure (for development only)
- JWT tokens stored in `localStorage`
- CORS enabled for localhost

### Production Checklist
- [ ] Generate secure `SECRET_KEY`
- [ ] Set `DEBUG=False`
- [ ] Use HTTPS
- [ ] Restrict CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up proper file storage (S3, etc.)
- [ ] Configure secure database passwords

---

## 📞 Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs (`/tmp/fastapi.log`)
3. Check Celery worker output
4. Review browser console (F12)

---

## 🎉 Success!

You should now have a fully functional AI voice cloning system running locally!

**Test the complete flow:**
1. Sign up → 2. Upload voice → 3. Generate audio → 4. Play & download

Enjoy building with Loqui! 🎙️✨

