# 🧪 Phase 2 Testing Guide - Authentication

## ✅ What We've Completed

### **Phase 1: Foundation** ✅

- ✅ API client configuration (`axios` with interceptors)
- ✅ Authentication utilities (token management)
- ✅ TypeScript types for all API responses
- ✅ AuthContext provider for global auth state

### **Phase 2: Authentication** ✅

- ✅ Register page connected to `/api/auth/register`
- ✅ Signin page connected to `/api/auth/login`
- ✅ Protected routes with authentication middleware
- ✅ User profile display from `/api/auth/me`
- ✅ Logout functionality

---

## 🚀 Prerequisites for Testing

### 1. Backend Must Be Running

```bash
cd backend
source venv/bin/activate
./scripts/start_all.sh
```

**Verify backend is running:**

- FastAPI: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 2. Frontend Must Be Running

```bash
cd loqui
npm run dev
```

**Frontend will be at:** http://localhost:3000

---

## 📝 Test Plan

### **Test 1: User Registration** ✅

1. Open browser to http://localhost:3000
2. Click "Get Started" on landing page
3. Click "Create an account" button
4. Fill in registration form:
   - Username: `testuser2`
   - Email: `testuser2@example.com`
   - Password: `testpass123`
5. Click "Create account"

**Expected Results:**

- ✅ No errors displayed
- ✅ Redirects to `/signin?created=1`
- ✅ Green success message: "Account created. You can now sign in."

**Backend Verification:**

```bash
# Check backend logs for:
POST /api/auth/register - 201 Created
```

---

### **Test 2: User Login** ✅

1. On signin page from Test 1, enter credentials:
   - Username: `testuser2`
   - Password: `testpass123`
2. Click "Sign In"

**Expected Results:**

- ✅ No errors displayed
- ✅ Redirects to `/home`
- ✅ User sees the protected dashboard layout
- ✅ Sidebar shows user information (username, email)

**Backend Verification:**

```bash
# Check backend logs for:
POST /api/auth/login - 200 OK
GET /api/auth/me - 200 OK
```

**Browser DevTools Check:**

- Open DevTools → Application → Local Storage
- Should see `loqui_auth_token` with JWT token
- Should see `loqui_user` with user data JSON

---

### **Test 3: Protected Routes** ✅

1. While logged in, try navigating to:

   - `/home` - ✅ Should work
   - `/my-voices` - ✅ Should work
   - `/lab` - ✅ Should work
   - `/generations` - ✅ Should work

2. Open a new incognito/private window
3. Try to access http://localhost:3000/home directly

**Expected Results:**

- ✅ Redirects to `/signin` immediately
- ✅ Shows login page
- ✅ Cannot access protected content without login

---

### **Test 4: User Profile Display** ✅

1. While logged in, check the sidebar footer
2. Look for user information display

**Expected Results:**

- ✅ Shows correct username
- ✅ Shows correct email
- ✅ Shows user initials in avatar (if no avatar image)
- ✅ Clicking the user dropdown shows menu

---

### **Test 5: Logout** ✅

1. While logged in, click on user name in sidebar
2. Click "Log out" in dropdown menu

**Expected Results:**

- ✅ Redirects to `/signin`
- ✅ Can no longer access protected routes
- ✅ localStorage is cleared (check DevTools)
- ✅ Must login again to access protected pages

---

### **Test 6: Session Persistence** ✅

1. Login successfully
2. Close browser tab
3. Reopen http://localhost:3000/home

**Expected Results:**

- ✅ Still logged in (no redirect to signin)
- ✅ User data still displayed correctly
- ✅ Can access all protected routes

---

### **Test 7: Error Handling** ✅

#### Invalid Registration

1. Try to register with existing username
2. Enter: username: `testuser2` (already exists)

**Expected:**

- ✅ Shows error message
- ✅ Stays on register page
- ✅ Can try again with different username

#### Invalid Login

1. Try to login with wrong password
2. Enter incorrect credentials

**Expected:**

- ✅ Shows error message: "Login failed..."
- ✅ Stays on signin page
- ✅ Can try again

#### Token Expiration

(Requires JWT token to expire - normally 30 minutes)

- ✅ Should redirect to `/signin?expired=1`
- ✅ Shows "Your session has expired" message

---

## 🔍 Common Issues & Solutions

### Issue: "Network Error" or "Cannot connect"

**Solution:** Make sure backend is running on port 8000

```bash
curl http://localhost:8000/health
```

### Issue: "CORS Error"

**Solution:** Backend CORS settings should allow `http://localhost:3000`
Check `backend/app/config.py` - `FRONTEND_URL` should be set correctly

### Issue: "401 Unauthorized" on protected routes

**Solution:**

1. Check if token exists in localStorage
2. Try logout and login again
3. Check backend logs for token validation errors

### Issue: Registration succeeds but can't login

**Solution:**

1. Check if user was actually created in database:

```bash
# From backend directory
source venv/bin/activate
python3 -c "
from app.database import SessionLocal
from app.models.user import User
db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f'Username: {u.username}, Email: {u.email}')
"
```

---

## ✅ Success Criteria

All tests should pass with:

- ✅ No console errors in browser DevTools
- ✅ Smooth redirects without flickering
- ✅ User data displays correctly
- ✅ Protected routes are truly protected
- ✅ Logout clears all auth data
- ✅ Error messages are user-friendly

---

## 📊 Backend API Endpoints Used

| Endpoint             | Method | Purpose          | Status       |
| -------------------- | ------ | ---------------- | ------------ |
| `/api/auth/register` | POST   | Create new user  | ✅ Connected |
| `/api/auth/login`    | POST   | Get JWT token    | ✅ Connected |
| `/api/auth/me`       | GET    | Get current user | ✅ Connected |

---

## 🎯 Ready for Next Phase

Once all tests pass, we're ready for:

- **Phase 3**: Voice Samples (upload, list, delete)
- **Phase 4**: Voice Generation (create, status, download)
- **Phase 5**: Library & Audio Playback

---

## 📸 Screenshots to Verify

Take screenshots of:

1. ✅ Successful registration → signin redirect
2. ✅ Logged-in dashboard with user profile
3. ✅ localStorage showing JWT token
4. ✅ Protected route redirect when not authenticated
5. ✅ Error message on invalid login

---

**Start Testing Now!** 🚀

Open http://localhost:3000 and follow the test plan above.
