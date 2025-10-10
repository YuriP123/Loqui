#!/bin/bash

# ============================================
# 📋 List All Voice Samples
# ============================================

BASE_URL="http://localhost:8000"
PYTHON="./venv/bin/python3"

# ANSI colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         📋 AVAILABLE VOICE SAMPLES                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Login
echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123" 2>/dev/null | \
  $PYTHON -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed! Make sure the server is running.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected${NC}"
echo ""

# Get samples
RESPONSE=$(curl -s "$BASE_URL/api/samples/" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

# Pretty print
echo -e "${BLUE}Available samples:${NC}"
echo ""
echo "$RESPONSE" | $PYTHON -m json.tool 2>/dev/null

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}💡 To test voice cloning with a sample:${NC}"
echo "   ./scripts/test_generation_only.sh <sample_id> \"Your text here\""
echo ""
echo "Example:"
echo "   ./scripts/test_generation_only.sh 1 \"Hello! This is my cloned voice.\""
echo ""


