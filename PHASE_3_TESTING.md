# ✅ Phase 3 Testing Guide: Voice Samples

## Overview

Phase 3 connects the "My Voices" page to the backend's `/api/samples` endpoints for:

- Uploading audio files
- Recording audio directly
- Listing user's voice samples
- Deleting voice samples

---

## Prerequisites

### 1. Backend Services Running

Make sure all backend services are running:

```bash
cd backend
source venv/bin/activate
./scripts/start_all.sh
```

Verify:

- FastAPI: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: Running
- Redis: Running
- Celery Worker: Running

### 2. Frontend Running

```bash
cd loqui
npm run dev
```

Verify:

- Frontend: http://localhost:3000

### 3. Logged In User

You must be logged in to test voice samples. If not:

1. Go to http://localhost:3000/register
2. Create a test account
3. Sign in

---

## Test Cases

### Test 1: Page Load & Empty State

1. Navigate to http://localhost:3000/my-voices
2. If you have no samples yet, you should see:
   - ✅ "My Voice Samples" section with "0 samples"
   - ✅ "No voice samples yet. Upload your first sample above!" message
   - ✅ Upload section at the top

**Backend Verification:**

```bash
# Check backend logs - should see:
GET /api/samples/?skip=0&limit=100
# Response: {"samples": [], "total": 0}
```

---

### Test 2: File Upload

1. Navigate to "Upload Voice Sample" section
2. Click on the file uploader or drag-and-drop an audio file
   - Use a WAV, MP3, or M4A file
   - Recommended: 30-60 second audio clip
3. Click "Open" or drop the file

**Expected Results:**

- ✅ Shows "Uploading..." spinner
- ✅ Green toast notification: "Sample uploaded successfully!"
- ✅ Sample appears in "My Voice Samples" section below
- ✅ Shows sample name (based on filename)
- ✅ Shows duration (e.g., "1:23")
- ✅ Shows upload date (e.g., "Just now")
- ✅ Status: "ready"

**Backend Verification:**

```bash
# Check backend logs for:
POST /api/samples/upload
# Response should include:
# {
#   "sample_id": 1,
#   "sample_name": "your-filename",
#   "file_size": 123456,
#   "duration_seconds": 45.2,
#   ...
# }
```

**Database Check:**

```bash
cd backend
source venv/bin/activate
python3 << EOF
from app.database import SessionLocal
from app.models.audio_sample import AudioSample

db = SessionLocal()
samples = db.query(AudioSample).all()
for s in samples:
    print(f"ID: {s.sample_id}, Name: {s.sample_name}, Duration: {s.duration_seconds}s")
db.close()
EOF
```

---

### Test 3: Multiple File Uploads

1. Upload 2-3 different audio files
2. Wait for each upload to complete

**Expected Results:**

- ✅ Each upload shows individual "Uploading..." state
- ✅ All samples appear in the list
- ✅ Sample count updates correctly (e.g., "3 samples")
- ✅ Samples sorted by upload date (newest first)

---

### Test 4: Audio Recording

1. Navigate to "Record Audio" section
2. Click "🎙️ Start Recording"
3. Browser will ask for microphone permission - **Allow**
4. Speak for 5-10 seconds
5. Click "⏹ Stop & Save Recording"

**Expected Results:**

- ✅ Button changes to "⏹ Stop & Save Recording" with red pulsing animation
- ✅ Shows "Recording in progress..." message
- ✅ After stopping, shows "Saving recording..." spinner
- ✅ Green toast: "Recording saved successfully!"
- ✅ Recording appears in the samples list with name like "Recording 10/15/2025"
- ✅ Duration matches your recording time

**Backend Verification:**

```bash
# Check backend logs for:
POST /api/samples/upload
# With upload_type: "recorded"
```

---

### Test 5: Sample Deletion

1. Find a sample card
2. Click the **trash icon** or "Delete" button
3. Confirm the deletion in the browser prompt

**Expected Results:**

- ✅ Browser shows "Are you sure?" confirmation dialog
- ✅ After confirming, green toast: "Sample deleted successfully!"
- ✅ Sample disappears from the list immediately
- ✅ Sample count updates

**Backend Verification:**

```bash
# Check backend logs for:
DELETE /api/samples/{sample_id}
# Response: 200 OK
```

**Database Check:**

```bash
cd backend
source venv/bin/activate
python3 << EOF
from app.database import SessionLocal
from app.models.audio_sample import AudioSample

db = SessionLocal()
samples = db.query(AudioSample).all()
print(f"Total samples: {len(samples)}")
db.close()
EOF
```

---

### Test 6: Play Sample (Placeholder)

1. Click the **play icon** on any sample card

**Expected Results:**

- ✅ Blue toast notification: "Audio playback will be implemented in Phase 5"
- ❌ Audio does not play yet (this is expected - audio playback comes in Phase 5)

---

### Test 7: Loading State

1. Clear your samples (delete all)
2. Refresh the page (Cmd+R / Ctrl+R)

**Expected Results:**

- ✅ Shows large spinner with "Loading your voice samples..." message
- ✅ After loading, shows empty state or your samples

---

### Test 8: Error Handling - Invalid File Type

1. Try to upload a non-audio file (e.g., .txt, .jpg)

**Expected Results:**

- ✅ Red toast error: "Failed to upload: Invalid file format..."
- ✅ Sample does NOT appear in the list
- ✅ Upload section remains ready for another upload

**Backend Verification:**

```bash
# Backend logs should show:
# 400 Bad Request - Invalid file format
```

---

### Test 9: Error Handling - File Too Large

1. Try to upload a very large audio file (>10MB if configured)

**Expected Results:**

- ✅ Red toast error: "Failed to upload: File too large..."
- ✅ Sample does NOT appear in the list

**Backend Check:**
Check `backend/app/config.py` for `MAX_FILE_SIZE` setting.

---

### Test 10: Concurrent Operations

1. Start uploading a file
2. While it's uploading, try to start recording

**Expected Results:**

- ✅ Both operations should work independently
- ✅ Upload shows "Uploading..." in file uploader section
- ✅ Recording shows "Saving recording..." in recorder section
- ✅ Both complete successfully

---

### Test 11: Page Refresh Persistence

1. Upload a few samples
2. Refresh the page (Cmd+R / Ctrl+R)

**Expected Results:**

- ✅ All samples are still there
- ✅ Sample count is correct
- ✅ No data loss

---

## Common Issues & Solutions

### Issue: "Failed to load samples: Network Error"

**Solution:**

- Backend not running. Start with `./scripts/start_all.sh`
- Check http://localhost:8000/health

### Issue: "Failed to upload: Invalid file format"

**Solution:**

- Only WAV, MP3, M4A files are supported
- Check file extension and MIME type

### Issue: "Microphone access denied"

**Solution:**

- Browser blocked microphone access
- Go to browser settings → Privacy → Microphone
- Allow http://localhost:3000

### Issue: Recording saves but duration is 0

**Solution:**

- Browser might not support MediaRecorder API
- Try Chrome or Edge (best support)

### Issue: Samples not appearing after upload

**Solution:**

1. Check backend logs for errors
2. Verify database connection:

```bash
cd backend
source venv/bin/activate
python3 -c "from app.database import engine; engine.connect()"
```

3. Check if sample was actually saved:

```bash
python3 << EOF
from app.database import SessionLocal
from app.models.audio_sample import AudioSample
db = SessionLocal()
print(db.query(AudioSample).count())
db.close()
EOF
```

### Issue: "401 Unauthorized" errors

**Solution:**

- Token expired, logout and login again
- Check if token exists in localStorage (DevTools → Application)

---

## Success Criteria

All tests should pass with:

- ✅ No console errors in browser DevTools
- ✅ Smooth upload/download operations
- ✅ Accurate sample metadata (name, duration, date)
- ✅ Immediate UI updates after actions
- ✅ Toast notifications for all operations
- ✅ Correct database persistence

---

## Backend API Endpoints Used

| Endpoint                   | Method | Purpose             | Status       |
| -------------------------- | ------ | ------------------- | ------------ |
| `/api/samples/`            | GET    | List user's samples | ✅ Connected |
| `/api/samples/upload`      | POST   | Upload audio file   | ✅ Connected |
| `/api/samples/{sample_id}` | GET    | Get specific sample | ✅ Connected |
| `/api/samples/{sample_id}` | DELETE | Delete sample       | ✅ Connected |

---

## Next Steps

Once all Phase 3 tests pass, we're ready for:

- **Phase 4**: Voice Generation Lab (create generations, poll status, download results)
- **Phase 5**: Audio Playback (play samples and generated audio in-app)
- **Phase 6**: Library Integration (unified view of all audio)

---

## Screenshots / Manual Verification

Take screenshots of:

1. ✅ Empty state with 0 samples
2. ✅ Successful file upload with toast notification
3. ✅ Recording in progress with pulsing button
4. ✅ Multiple samples in the list
5. ✅ Delete confirmation and success toast

---

## Debugging Tips

### Enable verbose logging:

**Backend:**

```bash
export LOG_LEVEL=DEBUG
```

**Frontend (Browser Console):**

```javascript
// Check API client base URL
console.log(process.env.NEXT_PUBLIC_API_URL);

// Check localStorage for token
console.log(localStorage.getItem("loqui_auth_token"));
```

### Monitor Network Requests:

- Open DevTools → Network tab
- Filter: "Fetch/XHR"
- Watch for:
  - `GET /api/samples/`
  - `POST /api/samples/upload`
  - `DELETE /api/samples/{id}`

---

**Phase 3 Complete!** ✅

After successful testing, update `INTEGRATION_PROGRESS.md` and proceed to Phase 4.
