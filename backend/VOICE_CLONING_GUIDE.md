# 🎙️ Voice Cloning with Replicate Chatterbox - Complete Guide

## 🌟 How It Works

Your Loqui backend uses **Replicate's Chatterbox model** to clone voices. Here's the complete workflow:

```
User Records Voice → Upload Sample → Submit Text Script → AI Clones Voice → Download Result
```

---

## 📋 **Step-by-Step Process**

### **Step 1: User Records or Uploads Voice Sample**

The user provides a voice recording (WAV/MP3) that will be used as the reference voice.

**Requirements:**

- Format: WAV or MP3
- Duration: 5-30 seconds recommended
- Quality: Clear, minimal background noise
- Content: Natural speech (not singing)

### **Step 2: Upload Voice Sample to Backend**

```bash
# Upload the voice sample
curl -X POST "http://localhost:8000/api/samples/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "sample_name=My Voice" \
  -F "upload_type=uploaded" \
  -F "file=@/path/to/voice_sample.wav"
```

**Response:**

```json
{
  "sample_id": 1,
  "sample_name": "My Voice",
  "file_path": "app/storage/samples/uuid-filename.wav",
  "file_size": 245760,
  "duration_seconds": 12.5,
  "upload_type": "uploaded",
  "uploaded_at": "2025-10-04T..."
}
```

**What Happens:**

1. File is validated (format, size)
2. Unique UUID filename generated
3. Saved to `app/storage/samples/`
4. Database record created
5. Sample ID returned

### **Step 3: Create Voice Generation Request**

```bash
# Generate cloned voice with custom text
curl -X POST "http://localhost:8000/api/generation/create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": 1,
    "model_name": "My Voice Model",
    "script_text": "Hello! This is a test of AI voice cloning. The weather today is beautiful, and I am excited to demonstrate this technology."
  }'
```

**Response:**

```json
{
  "audio_id": 1,
  "user_id": 2,
  "sample_id": 1,
  "model_name": "My Voice Model",
  "script_text": "Hello! This is a test...",
  "status": "PENDING",
  "generated_at": "2025-10-04T...",
  "output_file_path": null,
  "duration_seconds": null
}
```

**What Happens:**

1. Validates sample_id exists and belongs to user
2. Creates GeneratedAudio record with status="PENDING"
3. Queues Celery background task
4. Returns immediately (non-blocking)

### **Step 4: Background Processing (Automatic)**

Celery worker picks up the task and processes it:

```python
# What happens in the background:

1. Load voice sample from storage
2. Send to Replicate API:
   - audio_prompt: voice_sample.wav (reference voice)
   - prompt: "Your script text here"
3. Replicate/Chatterbox analyzes voice characteristics
4. Generates new audio with cloned voice
5. Downloads result
6. Saves to app/storage/generated/
7. Updates database status to "COMPLETED"
```

### **Step 5: Check Generation Status**

```bash
# Poll for status
curl "http://localhost:8000/api/generation/status/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (Processing):**

```json
{
  "audio_id": 1,
  "status": "PROCESSING",
  "progress": 45,
  "message": "AI is generating your voice..."
}
```

**Response (Completed):**

```json
{
  "audio_id": 1,
  "status": "COMPLETED",
  "progress": 100,
  "message": "Generation complete! Ready to download."
}
```

### **Step 6: Download Generated Audio**

```bash
# Download the cloned voice audio
curl "http://localhost:8000/api/library/download/generated/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o cloned_voice.wav
```

**What You Get:**

- WAV file with your script text
- Spoken in the cloned voice
- Same voice characteristics as sample
- High quality audio

---

## 🧪 **Complete Test Script**

Save this as `test_voice_cloning.sh`:

```bash
#!/bin/bash

# ============================================
# Voice Cloning End-to-End Test Script
# ============================================

BASE_URL="http://localhost:8000"
AUDIO_SAMPLE="./test_sample.wav"  # ⚠️ Provide your own WAV file

echo "🎙️  Testing Voice Cloning Workflow"
echo "=================================="
echo ""

# 1. Login
echo "1️⃣  Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123" | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    exit 1
fi
echo "✅ Logged in"
echo ""

# 2. Check AI Service
echo "2️⃣  Checking AI service..."
AI_STATUS=$(curl -s "$BASE_URL/api/monitoring/ai-service" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['service']['mode'])")
echo "   Mode: $AI_STATUS"
echo ""

# 3. Upload Voice Sample
echo "3️⃣  Uploading voice sample..."
if [ ! -f "$AUDIO_SAMPLE" ]; then
    echo "⚠️  No audio file found at: $AUDIO_SAMPLE"
    echo "   Please provide a WAV file"
    exit 1
fi

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/samples/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "sample_name=Test Voice Sample" \
  -F "upload_type=uploaded" \
  -F "file=@$AUDIO_SAMPLE")

SAMPLE_ID=$(echo $UPLOAD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('sample_id', 0))")

if [ "$SAMPLE_ID" -eq 0 ]; then
    echo "❌ Upload failed!"
    echo "$UPLOAD_RESPONSE" | python3 -m json.tool
    exit 1
fi

echo "✅ Sample uploaded (ID: $SAMPLE_ID)"
echo "$UPLOAD_RESPONSE" | python3 -m json.tool
echo ""

# 4. Create Generation Request
echo "4️⃣  Creating voice generation request..."
SCRIPT_TEXT="Hello! This is a test of AI voice cloning. The technology is amazing and can replicate voices with high accuracy."

GEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/generation/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sample_id\": $SAMPLE_ID, \"model_name\": \"Test Model\", \"script_text\": \"$SCRIPT_TEXT\"}")

AUDIO_ID=$(echo $GEN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('audio_id', 0))")

if [ "$AUDIO_ID" -eq 0 ]; then
    echo "❌ Generation request failed!"
    echo "$GEN_RESPONSE" | python3 -m json.tool
    exit 1
fi

echo "✅ Generation queued (ID: $AUDIO_ID)"
echo "$GEN_RESPONSE" | python3 -m json.tool
echo ""

# 5. Poll for Status
echo "5️⃣  Waiting for generation to complete..."
echo "   (This may take 30-60 seconds)"
echo ""

MAX_ATTEMPTS=30
ATTEMPT=0
STATUS="PENDING"

while [ "$STATUS" != "COMPLETED" ] && [ "$STATUS" != "FAILED" ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))

    STATUS_RESPONSE=$(curl -s "$BASE_URL/api/generation/status/$AUDIO_ID" \
      -H "Authorization: Bearer $TOKEN")

    STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'UNKNOWN'))")
    PROGRESS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))")

    echo "   Attempt $ATTEMPT: Status=$STATUS, Progress=$PROGRESS%"

    if [ "$STATUS" == "COMPLETED" ]; then
        echo ""
        echo "✅ Generation completed!"
        break
    elif [ "$STATUS" == "FAILED" ]; then
        echo ""
        echo "❌ Generation failed!"
        echo "$STATUS_RESPONSE" | python3 -m json.tool
        exit 1
    fi
done

if [ "$STATUS" != "COMPLETED" ]; then
    echo ""
    echo "⏰ Timeout waiting for generation"
    exit 1
fi

echo ""

# 6. Download Generated Audio
echo "6️⃣  Downloading generated audio..."
OUTPUT_FILE="cloned_voice_${AUDIO_ID}.wav"

curl -s "$BASE_URL/api/library/download/generated/$AUDIO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -o "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
    echo "✅ Downloaded: $OUTPUT_FILE"
    echo "   Size: $((FILE_SIZE / 1024)) KB"
    echo ""
    echo "🎉 SUCCESS! Voice cloning complete!"
    echo "   Play the file: $OUTPUT_FILE"
else
    echo "❌ Download failed!"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ All tests passed!"
```

---

## 🎯 **What Chatterbox Model Does**

### **Input:**

1. **Audio Prompt** (Reference Voice):

   - Your voice sample file
   - Analyzed for voice characteristics:
     - Pitch, tone, accent
     - Speech patterns, cadence
     - Emotional qualities

2. **Text Prompt** (Script):
   - The text you want to be spoken
   - Can be any length (up to ~5000 chars)

### **Processing:**

- AI analyzes voice sample
- Learns voice characteristics
- Generates new speech
- Applies voice characteristics to text
- Maintains natural prosody and emotion

### **Output:**

- High-quality WAV audio file
- Your script spoken in the cloned voice
- Natural-sounding speech
- Maintains voice characteristics

---

## 💡 **Tips for Best Results**

### **Voice Sample Quality:**

- ✅ **DO**: Use clear, well-recorded audio
- ✅ **DO**: Include natural speech patterns
- ✅ **DO**: 10-30 seconds of audio
- ✅ **DO**: Include variety in speech
- ❌ **DON'T**: Use music or singing
- ❌ **DON'T**: Use heavily processed audio
- ❌ **DON'T**: Use noisy recordings

### **Script Text:**

- ✅ Natural, conversational text works best
- ✅ Include punctuation for natural pauses
- ✅ Keep sentences reasonable length
- ❌ Avoid ALL CAPS (affects emotion)
- ❌ Very long run-on sentences

---

## 📊 **API Workflow Diagram**

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/samples/upload
       │    (voice_sample.wav)
       ▼
┌──────────────────┐
│ Upload Endpoint  │ ──► Save to storage/samples/
└──────┬───────────┘     Create DB record
       │                 Return sample_id
       │
       │ 2. POST /api/generation/create
       │    {sample_id, script_text}
       ▼
┌──────────────────┐
│ Generation API   │ ──► Create GeneratedAudio record
└──────┬───────────┘     Queue Celery task
       │                 Return audio_id (PENDING)
       │
       │ 3. Background Processing
       ▼
┌──────────────────┐
│  Celery Worker   │
└──────┬───────────┘
       │ ┌─────────────────────┐
       ├─► Load voice sample   │
       │ └─────────────────────┘
       │ ┌─────────────────────┐
       ├─► Send to Replicate   │
       │ │  - audio_prompt     │
       │ │  - prompt (text)    │
       │ └─────────────────────┘
       │ ┌─────────────────────┐
       ├─► Chatterbox AI       │
       │ │  Voice Analysis &   │
       │ │  Clone Generation   │
       │ └─────────────────────┘
       │ ┌─────────────────────┐
       ├─► Download result     │
       │ │  Save to generated/ │
       │ └─────────────────────┘
       │ ┌─────────────────────┐
       └─► Update DB status    │
           │  COMPLETED          │
           └─────────────────────┘
              │
              │ 4. GET /api/generation/status/{id}
              ▼
┌──────────────────┐
│   Client Polls   │ ◄─── {"status": "COMPLETED"}
└──────┬───────────┘
       │
       │ 5. GET /api/library/download/generated/{id}
       ▼
┌──────────────────┐
│ Download Audio   │ ──► Return cloned_voice.wav
└──────────────────┘
```

---

## 🔧 **Technical Details**

### **Replicate Integration Code:**

Located in: `app/services/replicate_integration.py`

Key function:

```python
async def generate_speech(
    sample_path: str,  # Path to voice sample
    text: str,         # Script to speak
    model_name: str    # Model name (metadata)
) -> Tuple[str, float, int]:
    # Returns: (output_path, duration, file_size)
```

### **Model Configuration:**

- **Model**: `resemble-ai/chatterbox`
- **API**: Replicate.com
- **Cost**: ~$0.001 per second of audio
- **Processing Time**: 30-90 seconds typical

### **Storage Locations:**

- Voice Samples: `app/storage/samples/`
- Generated Audio: `app/storage/generated/`
- Naming: UUID-based filenames

---

## ✅ **Verification**

Your system is ready if:

- ✅ Replicate API token configured
- ✅ Celery worker running
- ✅ Redis connected
- ✅ Storage directories exist
- ✅ `/api/monitoring/ai-service` shows "replicate" mode

Check with:

```bash
curl http://localhost:8000/api/monitoring/ai-service
```

Should return:

```json
{
  "service": {
    "mode": "replicate",
    "provider": "Replicate.com",
    "model": "resemble-ai/chatterbox",
    "replicate_available": true
  },
  "message": "Using real AI"
}
```

---

## 🎉 **You're Ready!**

Your Loqui backend has **full voice cloning capabilities** using state-of-the-art AI!

**Next Steps:**

1. Get a voice sample (WAV file)
2. Run the test script above
3. Listen to your cloned voice!

---

**Happy Voice Cloning! 🎤**





