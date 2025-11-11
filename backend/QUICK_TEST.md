# 🚀 Quick Voice Cloning Test (Using Existing Samples)

## Overview

This guide shows you how to test voice cloning using audio samples that are **already in the database**, without needing to upload new files.

---

## ✅ Prerequisites

1. Backend server is running
2. You have samples already in the database (in `app/storage/samples/`)

---

## 📋 Step 1: List Available Samples

First, see what samples are available in your database:

```bash
cd backend
./scripts/list_samples.sh
```

**Example Output:**

```json
{
  "samples": [
    {
      "sample_id": 1,
      "sample_name": "Voice Sample 1",
      "file_name": "2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav",
      "file_path": "./app/storage/samples/2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav",
      "duration_seconds": 12.5,
      "uploaded_at": "2024-10-09T10:00:00Z"
    },
    {
      "sample_id": 2,
      "sample_name": "Voice Sample 2",
      "file_name": "74173c76-0c84-4c31-a194-9e7445d0d490.wav",
      ...
    }
  ],
  "total": 5
}
```

**Note the `sample_id`** you want to use for testing.

---

## 🎙️ Step 2: Test Voice Cloning

Use an existing sample to generate a voice clone:

```bash
./scripts/test_generation_only.sh <sample_id> "Your custom text here"
```

**Example:**

```bash
./scripts/test_generation_only.sh 1 "Hello! This is a test of AI voice cloning technology."
```

---

## 📊 What Happens

```
┌─────────────────────────────────────────┐
│  1. Login to API                        │
│  2. Verify sample exists (sample_id)   │
│  3. Create generation request           │
│  4. Poll status until completed         │
│  5. Show result & play audio            │
└─────────────────────────────────────────┘
```

---

## 🎬 Complete Example

```bash
# Step 1: Start backend (if not running)
cd backend
source venv/bin/activate
./scripts/start_all.sh

# Step 2: List available samples
./scripts/list_samples.sh

# Output shows: sample_id: 1, 2, 3, 4, 5

# Step 3: Test with sample_id 1
./scripts/test_generation_only.sh 1 "This is my cloned voice speaking!"

# Expected output:
# ╔═══════════════════════════════════════════════════╗
# ║   🎙️  VOICE CLONING TEST (EXISTING SAMPLE)       ║
# ╚═══════════════════════════════════════════════════╝
#
# ✓ Sample ID: 1
# ✓ Script text: "This is my cloned voice speaking!..."
#
# [1/4] 🔐 Logging in...
# ✅ Logged in successfully
#
# [2/4] 🔍 Verifying sample exists...
# ✅ Sample found: Voice Sample 1
#
# [3/4] 🎬 Creating voice generation...
# ✅ Generation queued
#    Audio ID: 1
#    Status: PENDING
#
# [4/4] ⏳ Waiting for generation to complete...
#    ⣾ Attempt 12/120 | Status: PROCESSING | Progress: 75% | Processing...
#
# ✅ Generation completed!
#
# ✅ Generated audio details:
#    File: ./app/storage/generated/abc123-def456.wav
#    Duration: 8.5s
#    Size: 512 KB
#
# 🎉 SUCCESS! Voice cloning completed!
#
# 📁 Your cloned voice is saved at:
#    ./app/storage/generated/abc123-def456.wav
#
# 🎧 Play it with:
#    afplay ./app/storage/generated/abc123-def456.wav
#
# ▶️  Playing audio...
```

---

## 📁 Where Files Are Located

### Input (Existing Samples)

```
backend/app/storage/samples/
├── 2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav  (sample_id: 1)
├── 74173c76-0c84-4c31-a194-9e7445d0d490.wav  (sample_id: 2)
├── 8217e680-a5aa-4645-964a-d80b793a5140.wav  (sample_id: 3)
├── 9f8d83ee-5d5e-4933-a25a-037e1a4bc127.wav  (sample_id: 4)
└── d447d316-075c-48c5-9d65-aa87ff37163b.wav  (sample_id: 5)
```

### Output (Generated Voices)

```
backend/app/storage/generated/
└── <uuid>.wav  (created after generation)
```

---

## 🔧 Troubleshooting

### "Login failed! Make sure the server is running."

**Solution:**

```bash
./scripts/start_all.sh
```

### "Sample ID X not found!"

**Solution:** List samples to see available IDs:

```bash
./scripts/list_samples.sh
```

### "AI service in mock mode"

**Solution:** Make sure Replicate API token is set in `.env`:

```bash
REPLICATE_API_TOKEN=r8_YourTokenHere
```

Then restart:

```bash
./scripts/start_all.sh
```

### Generation stuck in PENDING

**Solution:** Check Celery workers are running:

```bash
ps aux | grep celery
```

If not running:

```bash
celery -A app.celery_worker worker --loglevel=info &
```

---

## 📝 Manual Testing (Without Scripts)

If you prefer to test manually:

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 2. List samples
curl -s http://localhost:8000/api/samples/ \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 3. Create generation (use sample_id from step 2)
curl -s -X POST http://localhost:8000/api/generation/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": 1,
    "model_name": "Test Clone",
    "script_text": "Your text here"
  }' | python3 -m json.tool

# 4. Check status (use audio_id from step 3)
curl -s http://localhost:8000/api/generation/status/1 \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 5. Get final result when completed
curl -s http://localhost:8000/api/generation/1 \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 🎯 Summary

**Two simple commands to test voice cloning:**

```bash
# 1. See what samples you have
./scripts/list_samples.sh

# 2. Test with a sample
./scripts/test_generation_only.sh 1 "Your text here"
```

**Result:** Generated voice saved to `backend/app/storage/generated/`

---

## 📚 Related Documentation

- **File Locations Guide:** `FILE_LOCATIONS_GUIDE.md`
- **Full Testing Guide:** `TESTING_GUIDE.md`
- **Voice Cloning Guide:** `VOICE_CLONING_GUIDE.md`

---

**Last Updated:** October 9, 2024  
**Loqui AI Voice Clone Studio**

