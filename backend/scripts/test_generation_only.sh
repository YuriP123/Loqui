#!/bin/bash

# ============================================
# 🎙️ Voice Cloning Test (Using Existing Sample)
# ============================================

BASE_URL="http://localhost:8000"

# Set Python to use the virtual environment
PYTHON="./venv/bin/python3"

# Check if Python exists in venv
if [ ! -f "$PYTHON" ]; then
    echo "❌ Virtual environment Python not found at: $PYTHON"
    echo "Please run this script from the backend directory."
    exit 1
fi

# ANSI colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎙️  VOICE CLONING TEST (EXISTING SAMPLE)       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Check parameters
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <sample_id> [script_text]${NC}"
    echo ""
    echo "Example:"
    echo "  $0 1 \"Hello! This is my cloned voice.\""
    echo ""
    echo -e "${BLUE}💡 TIP: First, get your sample_id by listing all samples:${NC}"
    echo "  curl http://localhost:8000/api/samples/ -H \"Authorization: Bearer YOUR_TOKEN\""
    echo ""
    exit 1
fi

SAMPLE_ID="$1"
SCRIPT_TEXT="${2:-Hello! This is a test of AI voice cloning using Replicate and Chatterbox. The technology can accurately clone and reproduce voice characteristics.}"

echo -e "${GREEN}✓${NC} Sample ID: $SAMPLE_ID"
echo -e "${GREEN}✓${NC} Script text: \"${SCRIPT_TEXT:0:50}...\""
echo ""

# ===================================
# STEP 1: LOGIN
# ===================================
echo -e "${BLUE}[1/4]${NC} 🔐 Logging in..."

TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123" 2>/dev/null | \
  $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed! Make sure the server is running.${NC}"
    echo ""
    echo "Start the server with:"
    echo "  ./scripts/start_all.sh"
    exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# ===================================
# STEP 2: VERIFY SAMPLE EXISTS
# ===================================
echo -e "${BLUE}[2/4]${NC} 🔍 Verifying sample exists..."

SAMPLE_INFO=$(curl -s "$BASE_URL/api/samples/$SAMPLE_ID" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

SAMPLE_NAME=$(echo $SAMPLE_INFO | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('sample_name', ''))" 2>/dev/null)

if [ -z "$SAMPLE_NAME" ]; then
    echo -e "${RED}❌ Sample ID $SAMPLE_ID not found!${NC}"
    echo ""
    echo "Available samples:"
    curl -s "$BASE_URL/api/samples/" \
      -H "Authorization: Bearer $TOKEN" | \
      $PYTHON -m json.tool 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Sample found: $SAMPLE_NAME${NC}"
echo ""

# ===================================
# STEP 3: CREATE GENERATION
# ===================================
echo -e "${BLUE}[3/4]${NC} 🎬 Creating voice generation..."

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
# STEP 4: POLL FOR COMPLETION
# ===================================
echo -e "${BLUE}[4/4]${NC} ⏳ Waiting for generation to complete..."
echo ""

MAX_ATTEMPTS=120  # 10 minutes (5 seconds * 120)
ATTEMPT=0
STATUS="PENDING"

# Spinner characters
SPINNER=("⣾" "⣽" "⣻" "⢿" "⡿" "⣟" "⣯" "⣷")

while [ "$STATUS" != "COMPLETED" ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
    
    STATUS_RESPONSE=$(curl -s "$BASE_URL/api/generation/status/$AUDIO_ID" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    STATUS=$(echo $STATUS_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('status', 'UNKNOWN'))" 2>/dev/null)
    PROGRESS=$(echo $STATUS_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))" 2>/dev/null)
    MESSAGE=$(echo $STATUS_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('message', ''))" 2>/dev/null)
    
    SPIN_INDEX=$((ATTEMPT % 8))
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
    echo "The generation is taking longer than expected."
    echo ""
    echo "Check status manually:"
    echo "  curl http://localhost:8000/api/generation/status/$AUDIO_ID -H \"Authorization: Bearer $TOKEN\""
    exit 1
fi

# ===================================
# FINAL: GET RESULT INFO
# ===================================
echo ""

FINAL_RESPONSE=$(curl -s "$BASE_URL/api/generation/$AUDIO_ID" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

FILE_PATH=$(echo $FINAL_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('output_file_path', ''))" 2>/dev/null)
FILE_SIZE=$(echo $FINAL_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('file_size', 0))" 2>/dev/null)
DURATION=$(echo $FINAL_RESPONSE | $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('duration_seconds', 0))" 2>/dev/null)

echo ""
echo -e "${GREEN}✅ Generated audio details:${NC}"
echo "   File: $FILE_PATH"
echo "   Duration: ${DURATION}s"
echo "   Size: $((FILE_SIZE / 1024)) KB"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🎉 SUCCESS! Voice cloning completed!${NC}"
echo ""
echo -e "${BLUE}📁 Your cloned voice is saved at:${NC}"
echo "   $FILE_PATH"
echo ""
echo -e "${BLUE}🎧 Play it with:${NC}"
echo "   afplay $FILE_PATH"
echo ""

# Try to play automatically if afplay is available
if command -v afplay &> /dev/null; then
    echo -e "${BLUE}▶️  Playing audio...${NC}"
    afplay "$FILE_PATH"
fi

