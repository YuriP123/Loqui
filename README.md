# Loqui


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



## Terminal 1 - local server
```
cd backend
source venv/bin/activate
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"  # macOS only
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Terminal 2 - celery worker
```
cd backend
source venv/bin/activate
 celery -A app.celery_app.celery_app worker -l info
```

## Terminal 3 - frontend
```
npm i
npm run dev
```


### Run Database Migrations

```bash
# Make sure you're in the backend directory with venv activated
alembic upgrade head
```

### Verify Redis is Running

```bash
redis-cli ping
# Should return: PONG
```