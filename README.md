# Loqui

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