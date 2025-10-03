````markdown
# Loqui AI Voice Clone Studio - Backend

FastAPI backend for Loqui AI Voice Clone Studio application.

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL 15+

### Installation

1. Create virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```
````

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Setup database:

```bash
# Create database and user in PostgreSQL
psql postgres
```

Then in PostgreSQL prompt:

```sql
CREATE DATABASE voiceclone_db;
CREATE USER voiceclone_user WITH PASSWORD 'voiceclone_pass';
GRANT ALL PRIVILEGES ON DATABASE voiceclone_db TO voiceclone_user;
\c voiceclone_db
GRANT ALL ON SCHEMA public TO voiceclone_user;
\q
```

4. Run migrations:

```bash
alembic upgrade head
```

5. Create .env file (copy from .env.example)

```bash
cp .env.example .env
# Edit .env with configuration
```

### Running

```bash
uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes
│   ├── models/       # Database models
│   ├── schemas/      # Pydantic schemas
│   ├── services/     # Business logic
│   ├── utils/        # Utilities
│   └── storage/      # File storage
│       ├── samples/  # Audio samples
│       └── generated/# Generated audio files
├── alembic/          # Database migrations
├── tests/            # Tests
├── requirements.txt  # Dependencies
├── .env              # Environment variables (not in git)
└── .env.example      # Example environment variables
```

## Development Progress

- [x] Week 1: Project setup, database models, migrations
- [ ] Week 2-3: Authentication & CRUD endpoints
- [ ] Week 4-5: AI integration
- [ ] Week 6: Testing & optimization

## Database Models

### Users

- User authentication and profile information
- Relationships to audio samples and generated audio

### Audio Samples

- Stores recorded or uploaded audio samples
- Used as source for voice cloning

### Generated Audio

- Stores AI-generated voice cloned audio
- Tracks generation status and metadata

### User Sessions

- Manages user authentication sessions
- JWT token management

### Generation Queue

- Manages background processing queue
- Tracks job status and retries

## API Endpoints (Planned)

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Audio Samples

- `POST /api/samples/upload` - Upload audio file
- `POST /api/samples/record` - Save recorded audio
- `GET /api/samples/` - List user's samples
- `DELETE /api/samples/{sample_id}` - Delete sample

### Generation

- `POST /api/generation/create` - Create generation job
- `GET /api/generation/status/{audio_id}` - Check status
- `GET /api/generation/{audio_id}` - Get generated audio
- `DELETE /api/generation/{audio_id}` - Delete generated audio

### Library

- `GET /api/library/all` - Get all audio (samples + generated)
- `GET /api/library/samples` - Get only samples
- `GET /api/library/generated` - Get only generated audio
- `GET /api/library/download/{file_id}` - Download file

## Environment Variables

See `.env.example` for all available configuration options:

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key (min 32 characters)
- `FRONTEND_URL` - Frontend URL for CORS
- `UPLOAD_DIR` - Directory for file storage
- `MAX_FILE_SIZE` - Maximum upload file size in bytes

## Tech Stack

- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL 15+ with SQLAlchemy 2.0
- **Migrations**: Alembic
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt via passlib
- **Validation**: Pydantic v2
- **File Handling**: aiofiles for async file operations

## Development Commands

```bash
# Run server with auto-reload
uvicorn app.main:app --reload

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Check current migration
alembic current

# Run tests (when implemented)
pytest
```

## Authors

- Parsa Banaei
- Yuri

## Course Information

CPSC 449 - Fall 2025 - Web Back-End Engineering

## License

This project is for educational purposes.
