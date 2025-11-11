# 🚀 Frontend Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed

## 1. Install Dependencies

```bash
cd loqui
npm install
```

### Required Packages for API Integration

If you need to install manually:

```bash
npm install axios @tanstack/react-query sonner
```

## 2. Environment Configuration

Create `.env.local` file in the `loqui` directory:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000
```

**Note:** This file might be git-ignored. Copy from `.env.example` if it exists.

## 3. Verify Setup

Check that all dependencies are installed:

```bash
npm list axios @tanstack/react-query sonner
```

## 4. Start Development Server

```bash
npm run dev
```

Frontend will run at: **http://localhost:3000**

## 5. Verify Backend Connection

1. Make sure backend is running at http://localhost:8000
2. Open browser to http://localhost:3000
3. Open DevTools → Network tab
4. Try to register/login
5. Should see API calls to `localhost:8000`

## Troubleshooting

### "Module not found" errors

```bash
npm install
npm run dev
```

### CORS errors

Make sure backend `/backend/app/config.py` has:

```python
FRONTEND_URL: str = "http://localhost:3000"
```

### API connection issues

Test backend directly:

```bash
curl http://localhost:8000/health
```

Should return:

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "celery": "running"
}
```

## File Structure (New Files)

```
loqui/src/
├── lib/
│   ├── api.ts              ← API client with axios
│   ├── auth.ts             ← Token management
│   └── utils.ts
├── types/
│   └── api.ts              ← TypeScript API types
├── contexts/
│   └── AuthContext.tsx     ← Auth state management
```

## Next Steps

Once setup is complete, proceed to `PHASE_2_TESTING.md` for testing instructions.
