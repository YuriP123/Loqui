# 🚀 Phase 3 Quick Start Guide

## Start Everything (5 minutes)

### 1. Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate
./scripts/start_all.sh
```

**Wait until you see:**

```
✅ All services started successfully!
   - FastAPI: http://localhost:8000
   - PostgreSQL: Running
   - Redis: Running
   - Celery Worker: Running
```

### 2. Start Frontend (Terminal 2)

```bash
cd loqui
npm run dev
```

**Wait until you see:**

```
✓ Ready on http://localhost:3000
```

---

## Test Phase 3 (10 minutes)

### Quick Test Sequence

1. **Register/Login**

   - Go to http://localhost:3000
   - Register a new account or login
   - You'll be redirected to `/home`

2. **Navigate to My Voices**

   - Click "My Voices" in the sidebar
   - You should see the upload section

3. **Upload a Sample**

   - Drag-and-drop an audio file (WAV/MP3/M4A)
   - **OR** click to browse and select a file
   - ✅ Watch for green toast: "Sample uploaded successfully!"
   - ✅ Sample appears in the list below

4. **Record a Sample**

   - Click "🎙️ Start Recording"
   - Allow microphone access
   - Speak for 5-10 seconds
   - Click "⏹ Stop & Save Recording"
   - ✅ Watch for green toast: "Recording saved successfully!"
   - ✅ Recording appears in the list

5. **Delete a Sample**

   - Click the trash icon on any sample
   - Confirm the deletion
   - ✅ Watch for green toast: "Sample deleted successfully!"
   - ✅ Sample disappears from list

6. **Try to Play (Placeholder)**
   - Click the play icon
   - ✅ Blue toast: "Audio playback will be implemented in Phase 5"

---

## What to Look For

### ✅ Success Indicators

- No console errors in browser DevTools
- Toast notifications appear for all actions
- Loading spinners during uploads/recordings
- Samples persist after page refresh
- Sample count updates correctly
- Smooth UI transitions

### ❌ Common Issues

**"Network Error"**

- Backend not running → Check Terminal 1

**"401 Unauthorized"**

- Not logged in → Go to `/signin`

**"Failed to upload"**

- Wrong file type → Use WAV/MP3/M4A only
- File too large → Keep under 10MB

**Microphone not working**

- Permission denied → Check browser settings
- No MediaRecorder → Use Chrome/Edge

---

## Quick Backend Verification

```bash
# Check if samples are in database
cd backend
source venv/bin/activate
python3 << EOF
from app.database import SessionLocal
from app.models.audio_sample import AudioSample
db = SessionLocal()
samples = db.query(AudioSample).all()
print(f"Total samples: {len(samples)}")
for s in samples:
    print(f"  - {s.sample_name} ({s.duration_seconds}s)")
db.close()
EOF
```

---

## API Endpoints Working

Test manually with curl:

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass" | jq -r .access_token)

# List samples
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/samples/

# Upload sample
curl -X POST http://localhost:8000/api/samples/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "sample_name=Test Sample" \
  -F "upload_type=uploaded" \
  -F "file=@path/to/audio.wav"

# Delete sample
curl -X DELETE http://localhost:8000/api/samples/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Summary

**Phase 3 Status:** ✅ Complete

**What Works:**

- ✅ File upload
- ✅ Audio recording
- ✅ Sample listing
- ✅ Sample deletion
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

**What's Next:**

- Phase 4: Voice Generation Lab
- Phase 5: Audio Playback

---

**For detailed testing, see:** `PHASE_3_TESTING.md`  
**For implementation details, see:** `PHASE_3_SUMMARY.md`

---

**Questions?** Check the logs:

- Backend: Terminal 1
- Frontend: Browser DevTools Console
- Database: `scripts/check_generation_status.py`
