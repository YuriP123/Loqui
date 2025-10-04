# AI Voice Clone Studio - Backend

FastAPI backend for AI Voice Clone Studio application with PostgreSQL database.

## 🚀 Features

- ✅ User Authentication (JWT)
- ✅ Audio Sample Upload (recorded/uploaded)
- ✅ Voice Generation Request System
- ✅ Library Management (unified view of samples + generated)
- ✅ File Storage System
- ✅ RESTful API with auto-generated documentation

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL 15+
- Virtual environment (recommended)

## 🛠️ Installation

### 1. Clone and Setup

git checkout backend
cd backend 2. Create Virtual Environment
python3 -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate 3. Install Dependencies
pip install -r requirements.txt 4. Setup PostgreSQL

# Create database

createdb voiceclone_db

# Or using psql

psql postgres
CREATE DATABASE voiceclone_db;
CREATE USER voiceclone_user WITH PASSWORD 'voiceclone_pass';
GRANT ALL PRIVILEGES ON DATABASE voiceclone_db TO voiceclone_user;
\q 5. Configure Environment

# Copy example env file

cp .env.example .env

# Edit .env with your settings

nano .env 6. Run Migrations
alembic upgrade head
🏃 Running the Application
Development Server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
The API will be available at:

API: http://localhost:8000
Swagger Docs: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc

📚 API Documentation
Quick Start

1. Register User
   curl -X POST http://localhost:8000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
   "username": "testuser",
   "email": "test@example.com",
   "password": "testpass123"
   }'
2. Login
   curl -X POST http://localhost:8000/api/auth/login \
    -d "username=testuser&password=testpass123"
3. Upload Audio Sample
   curl -X POST http://localhost:8000/api/samples/upload \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "sample_name=My Voice" \
    -F "upload_type=uploaded" \
    -F "file=@audio.wav"
4. Create Generation
   curl -X POST http://localhost:8000/api/generation/create \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
   "sample_id": 1,
   "model_name": "My Voice Model",
   "script_text": "Hello, this is a test."
   }'
   For complete API documentation, see API_DOCUMENTATION.md
   🧪 Testing
   Run All Tests
   pytest tests/ -v
   Run with Coverage
   pytest tests/ --cov=app --cov-report=html
   Run Specific Test File
   pytest tests/api/test_auth.py -v
   📁 Project Structure
   backend/
   ├── app/
   │ ├── api/ # API routes
   │ │ ├── auth.py # Authentication endpoints
   │ │ ├── samples.py # Audio sample endpoints
   │ │ ├── generation.py # Generation endpoints
   │ │ └── library.py # Library endpoints
   │ ├── models/ # SQLAlchemy models
   │ │ ├── user.py
   │ │ ├── audio_sample.py
   │ │ ├── generated_audio.py
   │ │ ├── user_session.py
   │ │ └── generation_queue.py
   │ ├── schemas/ # Pydantic schemas
   │ │ ├── user.py
   │ │ ├── audio.py
   │ │ ├── generation.py
   │ │ └── library.py
   │ ├── services/ # Business logic
   │ │ ├── auth_service.py
   │ │ ├── audio_service.py
   │ │ ├── generation_service.py
   │ │ └── library_service.py
   │ ├── utils/ # Utilities
   │ │ ├── security.py # Password & JWT handling
   │ │ ├── file_handler.py # File operations
   │ │ ├── validators.py # Input validation
   │ │ ├── dependencies.py # FastAPI dependencies
   │ │ └── exceptions.py # Exception handlers
   │ ├── storage/ # File storage
   │ │ ├── samples/ # Audio samples
   │ │ └── generated/ # Generated audio
   │ ├── config.py # Configuration
   │ ├── database.py # Database setup
   │ └── main.py # FastAPI application
   ├── alembic/ # Database migrations
   ├── tests/ # Test suite
   ├── scripts/ # Utility scripts
   ├── requirements.txt # Python dependencies
   ├── .env # Environment variables
   └── README.md # This file
   🗃️ Database Schema
   Tables

users - User accounts
audio_samples - Uploaded/recorded audio samples
generated_audio - AI-generated voice audio
user_sessions - Authentication sessions
generation_queue - Processing queue for generations

Relationships

User → Audio Samples (1:N)
User → Generated Audio (1:N)
Audio Sample → Generated Audio (1:N)
Generated Audio → Generation Queue (1:1)

🔐 Environment Variables
env# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/voiceclone_db

# JWT

SECRET_KEY=your-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage

UPLOAD_DIR=./app/storage
MAX_FILE_SIZE=10485760 # 10MB

# CORS

FRONTEND_URL=http://localhost:3000

# AI Model (configure when ready)

COLAB_NOTEBOOK_URL=
COLAB_API_KEY=
🐛 Troubleshooting
Database Connection Issues

# Check PostgreSQL is running

brew services list | grep postgresql

# Restart PostgreSQL

brew services restart postgresql@15

# Test connection

psql -U voiceclone_user -d voiceclone_db -h localhost
Migration Issues

# Reset migrations (DANGER: deletes all data)

alembic downgrade base
alembic upgrade head

# Create new migration

alembic revision --autogenerate -m "description"
File Upload Issues

# Check storage permissions

ls -la app/storage/

# Fix permissions

chmod -R 755 app/storage/
📝 Development Workflow
Making Changes

Create feature branch

git checkout -b feature/my-feature

Make changes and test

pytest tests/ -v

Commit changes

git add .
git commit -m "feat: add new feature"

Push to backend branch

git push origin backend
🚧 Roadmap
Week 1 ✅

Project setup
Database models
Basic FastAPI app

Week 2-3 ✅

Authentication system
CRUD endpoints
File upload/download
Library management

Week 4-5 (Next)

AI model integration
Background task processing
WebSocket for real-time updates

Week 6

Testing & optimization
Performance improvements
Documentation

📄 License
This project is for educational purposes.
