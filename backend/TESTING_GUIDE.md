# 🧪 Testing Voice Cloning - Complete Guide

## ⚠️ IMPORTANT: The Test Script Issue

The automated test script requires a **fresh audio file** (not one already in storage). Here's why:

When you try to upload a file that's already in `app/storage/samples/`, curl doesn't always set the correct MIME type, causing the upload to fail with:

```
"Invalid file format. Allowed formats: audio/wav, audio/mpeg, audio/mp3"
```

## ✅ SOLUTION: Use a Fresh Audio File

### Option 1: Record a New Voice Sample

**On macOS:**

1. Open **QuickTime Player**
2. File → New Audio Recording
3. Record 10-15 seconds of your voice
4. Save as `my_voice.wav` in your Desktop or Downloads

**On Windows:**

1. Open **Voice Recorder** app
2. Record 10-15 seconds
3. Save and export as WAV

**On Linux:**

1. Use `arecord`:

```bash
arecord -d 15 -f cd my_voice.wav
```

### Option 2: Use a Sample Audio File

Download a free audio sample:

```bash
# Download a test WAV file
curl -o test_voice.wav https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav
```

---

## 🚀 COMPLETE TEST WORKFLOW

### Step 1: Start the Backend

```bash
cd backend
source venv/bin/activate
./scripts/start_all.sh
```

Wait for:

```
✅ All services started successfully!
   - FastAPI: http://localhost:8000
   - PostgreSQL: Running
   - Redis: Running
   - Celery Worker: Running
```

### Step 2: Prepare Your Audio File

Make sure you have a **fresh WAV file** (not from `app/storage/samples/`):

```bash
# Example: Record using your Mac's microphone
# Or download a sample:
curl -o ~/Downloads/test_voice.wav https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav
```

### Step 3: Run the Test Script

```bash
cd backend
./scripts/test_complete_workflow.sh ~/Downloads/test_voice.wav "Hello! This is a test of AI voice cloning."
```

**Expected Output:**

```
╔═══════════════════════════════════════════════════╗
║   🎙️  LOQUI VOICE CLONING - COMPLETE WORKFLOW    ║
╚═══════════════════════════════════════════════════╝

✓ Audio sample: /Users/.../test_voice.wav
✓ Script text: "Hello! This is a test of AI voice cloning."

[1/6] 🔐 Logging in...
✅ Logged in successfully

[2/6] 🤖 Checking AI service...
✅ Replicate AI active

[3/6] 📤 Uploading voice sample...
✅ Sample uploaded
   ID: 6
   Duration: 12.5s
   Size: 1024 KB

[4/6] 🎬 Creating generation...
✅ Generation queued
   Audio ID: 1
   Status: PENDING

[5/6] ⏳ Waiting for completion...
   ⣾ Attempt 1/120 | Status: PROCESSING | Progress: 25% | Processing...
   ...

✅ Generation completed!

[6/6] 📥 Retrieving result...
✅ Generated audio details:
   File: ./app/storage/generated/abc123-def456.wav
   Duration: 8.5s
   Size: 512 KB

🎉 SUCCESS! Voice cloning completed!

📁 Your cloned voice is saved at:
   backend/app/storage/generated/abc123-def456.wav
```

---

## 🔧 MANUAL TESTING (Without Script)

If the script doesn't work, you can test manually:

### 1. Login and Get Token

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "Token: $TOKEN"
```

### 2. Upload Voice Sample

```bash
curl -X POST http://localhost:8000/api/samples/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "sample_name=My Test Voice" \
  -F "upload_type=uploaded" \
  -F "file=@~/Downloads/test_voice.wav"
```

**Note the `sample_id` from the response.**

### 3. Create Generation

```bash
curl -X POST http://localhost:8000/api/generation/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": 6,
    "model_name": "Test Clone",
    "script_text": "Hello! This is a test of voice cloning."
  }'
```

**Note the `audio_id` from the response.**

### 4. Check Status

```bash
curl http://localhost:8000/api/generation/status/1 \
  -H "Authorization: Bearer $TOKEN"
```

Repeat every 10 seconds until `status` is `COMPLETED`.

### 5. Get Result

```bash
curl http://localhost:8000/api/generation/1 \
  -H "Authorization: Bearer $TOKEN"
```

The response will include `file_path` showing where your generated voice is saved.

### 6. Listen to Result

```bash
# Navigate to generated folder
cd backend/app/storage/generated

# List files
ls -lh

# Play the file (macOS)
afplay <filename>.wav

# Play the file (Linux)
aplay <filename>.wav
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Invalid file format"

**Cause:** curl isn't setting the correct MIME type.

**Solution 1:** Use a fresh file (not from `app/storage/`)

**Solution 2:** Force MIME type in curl:

```bash
curl -X POST http://localhost:8000/api/samples/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "sample_name=My Voice" \
  -F "upload_type=uploaded" \
  -F "file=@test.wav;type=audio/wav"
  #                    ^^^^^^^^^^^^^^^^^ Force MIME type
```

**Solution 3:** Update validator to check file extension:

Edit `backend/app/utils/validators.py`:

```python
def validate_audio_file(file: UploadFile) -> bool:
    """Validate audio file format"""
    # Check extension as fallback
    if file.filename:
        ext = file.filename.lower().split('.')[-1]
        if ext in ['wav', 'mp3', 'mpeg']:
            return True

    if not file.content_type:
        raise HTTPException(status_code=400, detail="Could not determine file type")

    if file.content_type not in settings.ALLOWED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed formats: {', '.join(settings.ALLOWED_AUDIO_FORMATS)}"
        )

    return True
```

### Issue: "Login failed"

**Cause:** Backend server not running.

**Solution:**

```bash
cd backend
source venv/bin/activate
./scripts/start_all.sh
```

### Issue: "AI service in mock mode"

**Cause:** Replicate API token not set.

**Solution:** Add to `.env`:

```bash
REPLICATE_API_TOKEN=r8_YourTokenHere
```

Then restart:

```bash
./scripts/start_all.sh
```

### Issue: "Generation stuck in PENDING"

**Cause:** Celery workers not running.

**Solution:**

```bash
# Check if Celery is running
ps aux | grep celery

# If not, start it
cd backend
source venv/bin/activate
celery -A app.celery_worker worker --loglevel=info &
```

### Issue: "Database connection error"

**Cause:** PostgreSQL not running.

**Solution:**

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

---

## 📊 EXPECTED FILE LOCATIONS

After successful testing:

**Uploaded Sample:**

```
backend/app/storage/samples/
└── <uuid>.wav  (your voice sample)
```

**Generated Clone:**

```
backend/app/storage/generated/
└── <uuid>.wav  (AI-generated cloned voice)
```

---

## ✅ VERIFICATION CHECKLIST

Before testing, ensure:

- [ ] Backend server running (`http://localhost:8000/health` returns 200)
- [ ] PostgreSQL running (`psql -U voiceclone_user -d voiceclone_db`)
- [ ] Redis running (`redis-cli ping` returns "PONG")
- [ ] Celery workers running (`ps aux | grep celery`)
- [ ] Replicate API token set in `.env`
- [ ] Fresh audio file ready (WAV format recommended)
- [ ] Virtual environment activated (`source venv/bin/activate`)

---

## 🎯 QUICK START (TL;DR)

```bash
# 1. Get a fresh audio file
curl -o test.wav https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav

# 2. Start backend
cd backend
source venv/bin/activate
./scripts/start_all.sh

# 3. Run test
./scripts/test_complete_workflow.sh test.wav

# 4. Check result
ls -lh app/storage/generated/
```

---

## 📚 Related Documentation

- **File Locations Guide:** `FILE_LOCATIONS_GUIDE.md`
- **Voice Cloning Guide:** `VOICE_CLONING_GUIDE.md`
- **Production Checklist:** `PRODUCTION_CHECKLIST.md`
- **API Documentation:** `http://localhost:8000/docs`

---

**Last Updated:** October 9, 2024  
**Loqui AI Voice Clone Studio**

