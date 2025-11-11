# 📁 Voice Cloning - File Upload & Result Locations

## Quick Answer

**Where to upload:** API endpoint at `POST /api/samples/upload`  
**Files are saved to:** `backend/app/storage/samples/`  
**Generated results saved to:** `backend/app/storage/generated/`

---

## 📂 Complete File Storage Structure

```
backend/app/storage/
├── samples/          ← Your uploaded voice samples (input)
│   ├── 2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav
│   ├── 74173c76-0c84-4c31-a194-9e7445d0d490.wav
│   └── ... (other uploaded samples)
│
└── generated/        ← AI-generated cloned voices (output)
    └── <uuid>.wav    (created after generation completes)
```

---

## 1️⃣ UPLOADING YOUR VOICE SAMPLE

### Via API

**Endpoint:**

```
POST http://localhost:8000/api/samples/upload
```

**Required Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Form Data:**

- `sample_name` (string): A friendly name for your voice sample
- `upload_type` (enum): Either "uploaded" or "training"
- `file` (file): Your audio file (WAV, MP3, or MPEG)

**Example with curl:**

```bash
curl -X POST http://localhost:8000/api/samples/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "sample_name=My Voice Recording" \
  -F "upload_type=uploaded" \
  -F "file=@/path/to/your_voice.wav"
```

**Response:**

```json
{
  "sample_id": 1,
  "sample_name": "My Voice Recording",
  "file_name": "2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav",
  "file_path": "./app/storage/samples/2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav",
  "file_size": 1048576,
  "duration_seconds": 12.5,
  "upload_type": "uploaded",
  "uploaded_at": "2024-10-09T10:30:00Z"
}
```

### File Requirements

✅ **Supported Formats:** WAV, MP3, MPEG  
✅ **Max Size:** 10 MB (10,485,760 bytes)  
✅ **Recommended Duration:** 10-15 seconds  
✅ **Quality:** Clear speech, minimal background noise

### Where Your Upload Goes

**Absolute Path:**

```
/Users/parsabanaei/Development/CSUF/Fall 2025/CPSC 449 Web Back-End Engineering/Loqui/backend/CPSC449-Project/backend/app/storage/samples/<uuid>.wav
```

**Relative Path (from backend/):**

```
./app/storage/samples/<uuid>.wav
```

**File Naming:**  
Files are automatically renamed with a UUID (e.g., `2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav`) to prevent conflicts.

---

## 2️⃣ CREATING A VOICE CLONE (GENERATION)

### Via API

**Endpoint:**

```
POST http://localhost:8000/api/generation/create
```

**Required Headers:**

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "sample_id": 1,
  "model_name": "My Voice Model",
  "script_text": "Hello! This is the text I want spoken in my cloned voice."
}
```

**Example with curl:**

```bash
curl -X POST http://localhost:8000/api/generation/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": 1,
    "model_name": "My Voice Model",
    "script_text": "Your text here"
  }'
```

**Response:**

```json
{
  "audio_id": 1,
  "user_id": 1,
  "sample_id": 1,
  "model_name": "My Voice Model",
  "script_text": "Your text here",
  "status": "PENDING",
  "progress": 0,
  "file_path": null,
  "file_size": null,
  "duration_seconds": null,
  "error_message": null,
  "created_at": "2024-10-09T10:35:00Z"
}
```

---

## 3️⃣ MONITORING GENERATION PROGRESS

### Check Status

**Endpoint:**

```
GET http://localhost:8000/api/generation/status/{audio_id}
```

**Example:**

```bash
curl http://localhost:8000/api/generation/status/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (while processing):**

```json
{
  "audio_id": 1,
  "status": "PROCESSING",
  "progress": 45,
  "estimated_time_remaining": 30,
  "message": "Processing audio generation..."
}
```

**Response (completed):**

```json
{
  "audio_id": 1,
  "status": "COMPLETED",
  "progress": 100,
  "estimated_time_remaining": 0,
  "message": "Generation completed successfully!",
  "file_path": "./app/storage/generated/abc123-def456.wav",
  "file_size": 524288,
  "duration_seconds": 8.5
}
```

---

## 4️⃣ ACCESSING YOUR GENERATED VOICE

### Where the Generated File is Saved

**Absolute Path:**

```
/Users/parsabanaei/Development/CSUF/Fall 2025/CPSC 449 Web Back-End Engineering/Loqui/backend/CPSC449-Project/backend/app/storage/generated/<uuid>.wav
```

**Relative Path (from backend/):**

```
./app/storage/generated/<uuid>.wav
```

### How to Get Your File

**Option A: Via API**

```bash
# Get generation details (includes file_path)
curl http://localhost:8000/api/generation/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Option B: Direct File System Access**

```bash
# Navigate to generated folder
cd backend/app/storage/generated

# List all generated files
ls -lh

# Play a file (macOS)
afplay <filename>.wav

# Play a file (Linux)
aplay <filename>.wav
```

**Option C: Download via Frontend**
Your Next.js frontend can fetch the file and provide a download button:

```typescript
const response = await fetch(
  `http://localhost:8000/api/generation/${audioId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const data = await response.json();
const filePath = data.file_path;
// Then provide download link
```

---

## 5️⃣ COMPLETE EXAMPLE WORKFLOW

### Prerequisites

1. **Start the backend server:**

```bash
cd backend
source venv/bin/activate
./scripts/start_all.sh
```

2. **Create a test user or login:**

```bash
# Login (if user already exists)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123"

# Response includes: {"access_token": "eyJ0eXAi...", "token_type": "bearer"}
```

### Step-by-Step Process

**Step 1: Record Your Voice**

- Record 10-15 seconds of your voice
- Save as WAV file (e.g., `my_voice.wav`)

**Step 2: Upload Your Voice**

```bash
TOKEN="<your_jwt_token>"

curl -X POST http://localhost:8000/api/samples/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "sample_name=My Test Voice" \
  -F "upload_type=uploaded" \
  -F "file=@my_voice.wav"

# Note the sample_id from response (e.g., "sample_id": 1)
```

**File is now saved to:**

```
backend/app/storage/samples/<uuid>.wav
```

**Step 3: Create Voice Clone Generation**

```bash
curl -X POST http://localhost:8000/api/generation/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": 1,
    "model_name": "Test Clone",
    "script_text": "Hello! This is a test of AI voice cloning."
  }'

# Note the audio_id from response (e.g., "audio_id": 1)
```

**Step 4: Wait for Processing (Poll Status)**

```bash
# Check status every 5 seconds
curl http://localhost:8000/api/generation/status/1 \
  -H "Authorization: Bearer $TOKEN"

# Wait until status is "COMPLETED"
```

**Step 5: Access Your Cloned Voice**

```bash
# Get final result details
curl http://localhost:8000/api/generation/1 \
  -H "Authorization: Bearer $TOKEN"

# Or directly access the file
cd backend/app/storage/generated
ls -lh
afplay <generated_file>.wav
```

**Generated file is now at:**

```
backend/app/storage/generated/<uuid>.wav
```

---

## 6️⃣ AUTOMATED TESTING SCRIPT

### Using the Test Script

We provide an automated script that does all of the above:

```bash
cd backend
./scripts/test_complete_workflow.sh my_voice.wav "Custom text to speak"
```

**What it does:**

1. ✅ Logs in automatically (creates test user if needed)
2. ✅ Uploads your voice sample → `app/storage/samples/`
3. ✅ Creates generation request
4. ✅ Polls status until completed
5. ✅ Shows you the result path → `app/storage/generated/`
6. ✅ Automatically plays the generated audio

---

## 7️⃣ CONFIGURATION

### Storage Settings

Located in `backend/app/config.py`:

```python
# File Storage
UPLOAD_DIR: str = "./app/storage"
MAX_FILE_SIZE: int = 10485760  # 10MB
ALLOWED_AUDIO_FORMATS: list = ["audio/wav", "audio/mpeg", "audio/mp3"]
```

### Change Storage Location

To change where files are stored:

1. Edit `.env` file:

```bash
UPLOAD_DIR=/path/to/custom/storage
```

2. Or modify `config.py` directly:

```python
UPLOAD_DIR: str = "/path/to/custom/storage"
```

3. Ensure directories exist:

```bash
mkdir -p /path/to/custom/storage/samples
mkdir -p /path/to/custom/storage/generated
```

---

## 8️⃣ CURRENT FILES IN YOUR SYSTEM

### Existing Samples

You already have 5 voice samples uploaded:

```
✅ backend/app/storage/samples/2a6a90ce-3bfc-4af6-a841-dcff3169aa05.wav
✅ backend/app/storage/samples/74173c76-0c84-4c31-a194-9e7445d0d490.wav
✅ backend/app/storage/samples/8217e680-a5aa-4645-964a-d80b793a5140.wav
✅ backend/app/storage/samples/9f8d83ee-5d5e-4933-a25a-037e1a4bc127.wav
✅ backend/app/storage/samples/d447d316-075c-48c5-9d65-aa87ff37163b.wav
```

### Generated Files

Currently empty (no generations completed yet):

```
⚠️  backend/app/storage/generated/
    (no files yet)
```

---

## 9️⃣ TROUBLESHOOTING

### Upload Issues

**Problem:** "File too large"  
**Solution:** File must be under 10MB. Compress or trim your audio.

**Problem:** "Invalid file format"  
**Solution:** Only WAV, MP3, and MPEG formats are allowed.

**Problem:** "Authentication failed"  
**Solution:** Make sure you include the JWT token in Authorization header.

### Generation Issues

**Problem:** "Sample not found"  
**Solution:** Verify the `sample_id` exists by calling `GET /api/samples/`

**Problem:** "Generation stuck in PENDING"  
**Solution:**

- Check if Celery workers are running: `ps aux | grep celery`
- Check if Redis is running: `redis-cli ping`
- Start workers: `./scripts/start_all.sh`

**Problem:** "AI service in mock mode"  
**Solution:** Add Replicate API token to `.env`:

```bash
REPLICATE_API_TOKEN=r8_YourTokenHere
```

### File Access Issues

**Problem:** Can't find generated file  
**Solution:**

- Check status: `GET /api/generation/status/{audio_id}`
- Verify path in response `file_path` field
- Ensure generation status is "COMPLETED"

---

## 🎯 SUMMARY TABLE

| **What**        | **Where**           | **Path**                                           |
| --------------- | ------------------- | -------------------------------------------------- |
| Upload voice    | `samples/` folder   | `backend/app/storage/samples/<uuid>.wav`           |
| Generated voice | `generated/` folder | `backend/app/storage/generated/<uuid>.wav`         |
| Upload API      | POST endpoint       | `http://localhost:8000/api/samples/upload`         |
| Generation API  | POST endpoint       | `http://localhost:8000/api/generation/create`      |
| Status check    | GET endpoint        | `http://localhost:8000/api/generation/status/{id}` |
| Config file     | Settings            | `backend/app/config.py`                            |
| Test script     | Automated test      | `backend/scripts/test_complete_workflow.sh`        |

---

## ✅ QUICK START

```bash
# 1. Start backend
cd backend
source venv/bin/activate
./scripts/start_all.sh

# 2. Run automated test
./scripts/test_complete_workflow.sh your_voice.wav

# 3. Check results
ls -lh app/storage/generated/
```

**That's it! Your voice clone will be in `backend/app/storage/generated/`** 🎉

---

## 📚 Related Documentation

- **Full Voice Cloning Guide:** `VOICE_CLONING_GUIDE.md`
- **Production Checklist:** `PRODUCTION_CHECKLIST.md`
- **Quick Start:** `QUICK_START.md`
- **API Documentation:** `http://localhost:8000/docs` (when server is running)

---

**Last Updated:** October 9, 2024  
**Backend Version:** 1.0.0  
**Loqui AI Voice Clone Studio**

