#!/bin/bash

BASE_URL="http://localhost:8000"

echo "=== Testing Audio Upload ==="
echo ""

# Login first
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo "Token obtained"
echo ""

# Create a test audio file (if you have one, replace this path)
# For now, we'll just show the command structure
echo "To test upload, use this command with a real audio file:"
echo ""
echo "curl -X POST \"$BASE_URL/api/samples/upload\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -F \"sample_name=My Test Sample\" \\"
echo "  -F \"upload_type=uploaded\" \\"
echo "  -F \"file=@/path/to/your/audio.wav\""
echo ""
