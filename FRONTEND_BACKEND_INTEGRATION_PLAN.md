# 🔗 Loqui Frontend-Backend Integration Plan

## 📊 Current State Analysis

### ✅ Backend (Ready)

- **FastAPI Backend**: Fully functional with all endpoints
- **Authentication**: JWT-based auth with register, login, and user endpoints
- **Voice Samples**: Upload, list, get, delete samples
- **Voice Generation**: Create, status check, list, get, delete generations
- **Library**: Unified library view with download capabilities
- **Celery**: Background task processing for AI voice generation
- **Replicate AI**: Real AI voice cloning integration

**API Base URL**: `http://localhost:8000`

### ⚠️ Frontend (Needs Connection)

- **Next.js 15**: Modern React framework with App Router
- **UI Components**: Beautiful UI with shadcn/ui, Radix UI, Tailwind
- **Pages Created**: Landing, signin, register, dashboard, lab, my-voices, generations
- **Mock Data**: Currently using hardcoded mock data
- **No API Integration**: All forms and actions are simulated

---

## 🎯 Integration Plan (14 Steps)

### Phase 1: Foundation Setup (Steps 1-2)

#### **Step 1: Create API Configuration & Utilities**

**Files to Create:**

- `src/lib/api.ts` - Axios/fetch configuration with base URL and interceptors
- `src/lib/auth.ts` - Token management utilities (get, set, remove)
- `src/types/api.ts` - TypeScript types for API responses

**What We'll Do:**

- Setup API client with `http://localhost:8000` base URL
- Create request/response interceptors for auth tokens
- Add error handling and retry logic
- Define TypeScript interfaces matching backend schemas

---

#### **Step 2: Create Context Providers**

**Files to Create:**

- `src/contexts/AuthContext.tsx` - User authentication state
- `src/contexts/ApiContext.tsx` - API loading/error states

**What We'll Do:**

- Create React Context for global auth state
- Manage JWT token storage in localStorage/cookies
- Provide login, logout, register functions
- Track loading and error states globally

---

### Phase 2: Authentication (Steps 3-6)

#### **Step 3: Connect Register Page**

**File to Modify:** `src/app/register/page.tsx`

**Changes:**

- Replace mock submission with API call to `POST /api/auth/register`
- Add form validation
- Handle success → redirect to signin with ?created=1
- Handle errors (username taken, email exists, etc.)

**Backend Endpoint:**

```
POST /api/auth/register
Body: { username, email, password, full_name? }
Response: User object
```

---

#### **Step 4: Connect Signin Page**

**File to Modify:** `src/app/signin/page.tsx`

**Changes:**

- Replace mock login with API call to `POST /api/auth/login`
- Store JWT token in localStorage
- Fetch user data from `/api/auth/me`
- Update AuthContext with user data
- Redirect to /home on success

**Backend Endpoints:**

```
POST /api/auth/login (form-data: username, password)
Response: { access_token, token_type }

GET /api/auth/me (with Bearer token)
Response: User object
```

---

#### **Step 5: Implement Protected Routes**

**Files to Modify:**

- `src/app/(protected)/layout.tsx`
- Create `src/middleware.ts` or `src/hooks/useAuth.ts`

**Changes:**

- Check for valid token on protected routes
- Redirect to /signin if not authenticated
- Show loading state while checking auth
- Handle token expiration

---

#### **Step 6: Connect User Profile**

**Files to Modify:**

- `src/app/data.tsx` - Remove mock user data
- `src/components/nav-user.tsx` - Use real user data from context

**Changes:**

- Get user data from AuthContext
- Display real username, email
- Add logout functionality
- Show user avatar (if uploaded)

---

### Phase 3: Voice Samples (Step 7)

#### **Step 7: Connect My Voices Page**

**File to Modify:** `src/app/(protected)/my-voices/page.tsx`

**Changes:**

- Fetch samples from `GET /api/samples/`
- Implement file upload to `POST /api/samples/upload`
- Support both file upload and recording
- Add delete functionality `DELETE /api/samples/{id}`
- Show loading states and error messages
- Display real sample data (duration, upload date, size)

**Backend Endpoints:**

```
GET /api/samples/?skip=0&limit=100
POST /api/samples/upload (multipart/form-data)
GET /api/samples/{sample_id}
DELETE /api/samples/{sample_id}
```

---

### Phase 4: Voice Generation (Steps 8-9)

#### **Step 8: Connect Lab Generation Wizard**

**File to Modify:** `src/app/(protected)/lab/page.tsx`

**Changes:**

- Step 1: Fetch real voice samples from API
- Step 2: Keep script input (no API needed)
- Step 3: Call `POST /api/generation/create` with:
  - `sample_id` (from selected voice)
  - `model_name` (from title input)
  - `script_text` (from script textarea)
- Return generation ID from API

**Backend Endpoint:**

```
POST /api/generation/create
Body: { sample_id, model_name, script_text }
Response: GeneratedAudio object with audio_id
```

---

#### **Step 9: Implement Real-Time Status Polling**

**File to Modify:** `src/app/(protected)/lab/page.tsx`

**Changes:**

- After creating generation, poll `GET /api/generation/status/{audio_id}`
- Update progress bar based on status (pending → processing → completed)
- Show progress percentage (10% → 50% → 100%)
- When completed, fetch final result from `GET /api/generation/{audio_id}`
- Display audio player with download option
- Handle errors (failed status)

**Backend Endpoints:**

```
GET /api/generation/status/{audio_id}
Response: { audio_id, status, progress, message }

GET /api/generation/{audio_id}
Response: Full GeneratedAudio object with output_file_path
```

---

### Phase 5: Library & Generations (Steps 10-12)

#### **Step 10: Connect Generations Page**

**File to Modify:** `src/app/(protected)/generations/page.tsx`

**Changes:**

- Fetch all generations from `GET /api/generation/`
- Display in list/grid view
- Show status badges (pending, processing, completed, failed)
- Add filter by status
- Implement delete functionality
- Add "View Details" modal

**Backend Endpoints:**

```
GET /api/generation/?skip=0&limit=100&status_filter=completed
DELETE /api/generation/{audio_id}
```

---

#### **Step 11: Connect Library Page**

**File to Create/Modify:** `src/app/(protected)/home/page.tsx` or library page

**Changes:**

- Fetch combined library from `GET /api/library/all`
- Display both samples and generated audio
- Add filters (samples only, generated only)
- Implement download for both types
- Add delete for both types

**Backend Endpoints:**

```
GET /api/library/all?skip=0&limit=100
GET /api/library/samples
GET /api/library/generated
DELETE /api/library/{item_type}/{item_id}
```

---

#### **Step 12: Implement Audio Playback**

**File to Modify:** `src/components/audio-player.tsx`

**Changes:**

- Replace mock audio URL with real download endpoint
- For samples: `GET /api/library/download/sample/{sample_id}`
- For generated: `GET /api/library/download/generated/{audio_id}`
- Add download button using the same endpoint
- Stream audio directly in browser

**Backend Endpoint:**

```
GET /api/library/download/{item_type}/{item_id}
Response: Audio file (WAV) stream
```

---

### Phase 6: Testing & Polish (Steps 13-14)

#### **Step 13: End-to-End Testing**

**What to Test:**

1. ✅ Register new user
2. ✅ Login with credentials
3. ✅ Upload voice sample
4. ✅ Create voice generation
5. ✅ Monitor generation progress
6. ✅ Play generated audio
7. ✅ Download audio files
8. ✅ View all generations
9. ✅ Delete samples and generations
10. ✅ Logout and login again

---

#### **Step 14: Error Handling & UX Polish**

**Global Improvements:**

- Add toast notifications for success/error
- Implement loading skeletons
- Add empty states with helpful CTAs
- Handle network errors gracefully
- Add retry buttons on failures
- Implement optimistic UI updates
- Add confirmation modals for deletes
- Show file size limits and validations

---

## 📁 New Files to Create

```
src/
├── lib/
│   ├── api.ts              ← API client configuration
│   ├── auth.ts             ← Token management
│   └── utils.ts            ← Helper functions
├── types/
│   └── api.ts              ← TypeScript API types
├── contexts/
│   ├── AuthContext.tsx     ← Auth state management
│   └── ApiContext.tsx      ← API loading states
└── hooks/
    ├── useAuth.ts          ← Auth hook
    ├── useSamples.ts       ← Samples hook
    └── useGenerations.ts   ← Generations hook
```

---

## 🔧 Environment Variables

Create `.env.local` in frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000
```

---

## 📦 Additional Dependencies Needed

```bash
npm install axios
npm install @tanstack/react-query  # For data fetching
npm install sonner  # For toast notifications
npm install zustand  # Optional: for global state
```

---

## 🎨 Key Backend Endpoints Summary

| Feature           | Endpoint                            | Method | Auth Required |
| ----------------- | ----------------------------------- | ------ | ------------- |
| Register          | `/api/auth/register`                | POST   | ❌            |
| Login             | `/api/auth/login`                   | POST   | ❌            |
| Get User          | `/api/auth/me`                      | GET    | ✅            |
| Upload Sample     | `/api/samples/upload`               | POST   | ✅            |
| List Samples      | `/api/samples/`                     | GET    | ✅            |
| Delete Sample     | `/api/samples/{id}`                 | DELETE | ✅            |
| Create Generation | `/api/generation/create`            | POST   | ✅            |
| Check Status      | `/api/generation/status/{id}`       | GET    | ✅            |
| List Generations  | `/api/generation/`                  | GET    | ✅            |
| Delete Generation | `/api/generation/{id}`              | DELETE | ✅            |
| Library All       | `/api/library/all`                  | GET    | ✅            |
| Download Audio    | `/api/library/download/{type}/{id}` | GET    | ✅            |

---

## 🚀 Ready to Start!

**Let's begin with Step 1: API Configuration Setup**

Would you like me to proceed with creating the API utilities and configuration files?
