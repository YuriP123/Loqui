#!/bin/bash

# ============================================
# 🎙️ Voice Cloning Complete Workflow Test
# ============================================

BASE_URL="http://localhost:8000"

# Set Python to use the virtual environment (relative to backend directory)
# This script should be run from the backend directory
PYTHON="./venv/bin/python3"

# Check if Python exists in venv
if [ ! -f "$PYTHON" ]; then
    echo "❌ Virtual environment Python not found at: $PYTHON"
    echo "Please run this script from the backend directory:"
    echo "  cd backend"
    echo "  ./scripts/test_complete_workflow.sh <audio_file>"
    exit 1
fi

# ANSI colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎙️  LOQUI VOICE CLONING - COMPLETE WORKFLOW    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Check if audio sample is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  No audio sample provided!${NC}"
    echo ""
    echo "Usage: $0 <path_to_audio_sample.wav> [script_text]"
    echo ""
    echo "Example:"
    echo "  $0 my_voice.wav"
    echo "  $0 my_voice.wav \"Hello, this is my cloned voice!\""
    echo ""
    echo -e "${BLUE}📝 You need a voice sample (WAV or MP3) to test voice cloning.${NC}"
    echo ""
    echo "Don't have one? Record yourself:"
    echo "  - Use Voice Memos (Mac) or Sound Recorder (Windows)"
    echo "  - Record 10-15 seconds of natural speech"
    echo "  - Save as WAV format"
    echo ""
    exit 1
fi

AUDIO_SAMPLE="$1"
SCRIPT_TEXT="${2:-Hello! This is a test of AI voice cloning using Replicate and Chatterbox. The technology can accurately clone and reproduce voice characteristics.}"

# Validate audio file exists
if [ ! -f "$AUDIO_SAMPLE" ]; then
    echo -e "${RED}❌ Audio file not found: $AUDIO_SAMPLE${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Audio sample: $AUDIO_SAMPLE"
echo -e "${GREEN}✓${NC} Script text: \"${SCRIPT_TEXT:0:50}...\""
echo ""

# ===================================
# STEP 1: LOGIN
# ===================================
echo -e "${BLUE}[1/6]${NC} 🔐 Logging in..."

TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123" 2>/dev/null | \
  $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed! Make sure the server is running.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# ===================================
# STEP 2: CHECK AI SERVICE
# ===================================
echo -e "${BLUE}[2/6]${NC} 🤖 Checking AI service..."

AI_RESPONSE=$(curl -s "$BASE_URL/api/monitoring/ai-service" 2>/dev/null)
AI_MODE=$(echo $AI_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin)['service']['mode'])" 2>/dev/null)

if [ "$AI_MODE" != "replicate" ]; then
    echo -e "${RED}❌ AI service not in Replicate mode!${NC}"
    echo "Current mode: $AI_MODE"
    echo ""
    echo "Make sure REPLICATE_API_TOKEN is set in .env"
    exit 1
fi

echo -e "${GREEN}✅ Replicate AI active${NC}"
echo ""

# ===================================
# STEP 3: UPLOAD VOICE SAMPLE
# ===================================
echo -e "${BLUE}[3/6]${NC} 📤 Uploading voice sample..."

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/samples/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "sample_name=Voice Cloning Test Sample" \
  -F "upload_type=uploaded" \
  -F "file=@$AUDIO_SAMPLE" 2>/dev/null)

SAMPLE_ID=$(echo $UPLOAD_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('sample_id', 0))" 2>/dev/null)

if [ "$SAMPLE_ID" -eq 0 ]; then
    echo -e "${RED}❌ Upload failed!${NC}"
    echo "$UPLOAD_RESPONSE" | $PYTHON -m json.tool 2>/dev/null
    exit 1
fi

SAMPLE_DURATION=$(echo $UPLOAD_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('duration_seconds', 0))" 2>/dev/null)
SAMPLE_SIZE=$(echo $UPLOAD_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('file_size', 0))" 2>/dev/null)

echo -e "${GREEN}✅ Sample uploaded${NC}"
echo "   ID: $SAMPLE_ID"
echo "   Duration: ${SAMPLE_DURATION}s"
echo "   Size: $((SAMPLE_SIZE / 1024)) KB"
echo ""

# ===================================
# STEP 4: CREATE GENERATION REQUEST
# ===================================
echo -e "${BLUE}[4/6]${NC} 🎨 Creating voice generation request..."

GEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/generation/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sample_id\": $SAMPLE_ID, \"model_name\": \"Test Clone Model\", \"script_text\": \"$SCRIPT_TEXT\"}" 2>/dev/null)

AUDIO_ID=$(echo $GEN_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('audio_id', 0))" 2>/dev/null)

if [ "$AUDIO_ID" -eq 0 ]; then
    echo -e "${RED}❌ Generation request failed!${NC}"
    echo "$GEN_RESPONSE" | $PYTHON -m json.tool 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Generation queued${NC}"
echo "   Audio ID: $AUDIO_ID"
echo "   Status: PENDING"
echo ""

# ===================================
# STEP 5: WAIT FOR COMPLETION
# ===================================
echo -e "${BLUE}[5/6]${NC} ⏳ Waiting for AI to generate voice..."
echo "   ${YELLOW}(This typically takes 30-90 seconds)${NC}"
echo ""

MAX_ATTEMPTS=40
ATTEMPT=0
STATUS="PENDING"
SPINNER=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

while [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
    
    STATUS_RESPONSE=$(curl -s "$BASE_URL/api/generation/status/$AUDIO_ID" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    STATUS=$(echo $STATUS_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('status', 'UNKNOWN'))" 2>/dev/null)
    PROGRESS=$(echo $STATUS_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))" 2>/dev/null)
    MESSAGE=$(echo $STATUS_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('message', ''))" 2>/dev/null)
    
    SPIN_INDEX=$((ATTEMPT % 10))
    echo -ne "\r   ${SPINNER[$SPIN_INDEX]} Attempt $ATTEMPT/$MAX_ATTEMPTS | Status: $STATUS | Progress: $PROGRESS% | $MESSAGE                    "
    
    if [ "$STATUS" == "completed" ]; then
        echo ""
        echo ""
        echo -e "${GREEN}✅ Generation completed!${NC}"
        break
    elif [ "$STATUS" == "failed" ]; then
        echo ""
        echo ""
        echo -e "${RED}❌ Generation failed!${NC}"
        echo "$STATUS_RESPONSE" | $PYTHON -m json.tool 2>/dev/null
        exit 1
    fi
done

if [ "$STATUS" != "completed" ]; then
    echo ""
    echo ""
    echo -e "${RED}⏰ Timeout waiting for generation${NC}"
    echo "   The generation may still be processing."
    echo "   Check status manually:"
    echo "   curl \"$BASE_URL/api/generation/status/$AUDIO_ID\" -H \"Authorization: Bearer $TOKEN\""
    exit 1
fi

echo ""

# ===================================
# STEP 6: DOWNLOAD RESULT
# ===================================
echo -e "${BLUE}[6/6]${NC} 💾 Downloading generated audio..."

OUTPUT_FILE="cloned_voice_$(date +%Y%m%d_%H%M%S).wav"

HTTP_CODE=$(curl -s -w "%{http_code}" -o "$OUTPUT_FILE" \
  "$BASE_URL/api/library/download/generated/$AUDIO_ID" \
  -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_CODE" -eq 200 ] && [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
    echo -e "${GREEN}✅ Downloaded successfully${NC}"
    echo "   File: $OUTPUT_FILE"
    echo "   Size: $((FILE_SIZE / 1024)) KB"
else
    echo -e "${RED}❌ Download failed (HTTP $HTTP_CODE)${NC}"
    rm -f "$OUTPUT_FILE"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║   🎉 SUCCESS! Voice cloning complete!           ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Your cloned voice:${NC} $OUTPUT_FILE"
echo ""
echo -e "${YELLOW}🎧 Play it:${NC}"
echo "   afplay $OUTPUT_FILE        # Mac"
echo "   aplay $OUTPUT_FILE         # Linux"
echo "   start $OUTPUT_FILE         # Windows"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "   ✓ Voice Sample ID: $SAMPLE_ID"
echo "   ✓ Generated Audio ID: $AUDIO_ID"
echo "   ✓ Processing Time: ~$((ATTEMPT * 3)) seconds"
echo "   ✓ Output Size: $((FILE_SIZE / 1024)) KB"
echo ""
echo -e "${GREEN}All tests passed! ✨${NC}"

