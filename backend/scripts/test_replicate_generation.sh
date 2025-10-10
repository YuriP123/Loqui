#!/bin/bash

echo "🎙️  Testing Replicate Voice Generation"
echo "======================================"

BASE_URL="http://localhost:8000"

# 1. Register/Login
echo "1. Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -d "username=testuser&password=testpass123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "Need to register first..."
    curl -s -X POST "$BASE_URL/api/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
      }' | python3 -m json.tool
    
    TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -d "username=testuser&password=testpass123" \
      | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
fi

echo "✅ Logged in"
echo ""

# 2. Check AI service
echo "2. Checking AI service..."
curl -s "$BASE_URL/api/monitoring/ai-service" | python3 -m json.tool
echo ""

# 3. Upload a sample (you'll need a real .wav file)
echo "3. To upload a sample and test generation:"
echo ""
echo "   curl -X POST \"$BASE_URL/api/samples/upload\" \\"
echo "     -H \"Authorization: Bearer $TOKEN\" \\"
echo "     -F \"sample_name=My Voice\" \\"
echo "     -F \"upload_type=uploaded\" \\"
echo "     -F \"file=@your_audio.wav\""
echo ""
echo "4. Then create generation:"
echo ""
echo "   curl -X POST \"$BASE_URL/api/generation/create\" \\"
echo "     -H \"Authorization: Bearer $TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"sample_id\": 1, \"model_name\": \"Test\", \"script_text\": \"Hello world\"}'"
echo ""
echo "5. Monitor status:"
echo ""
echo "   curl \"$BASE_URL/api/generation/status/1\" \\"
echo "     -H \"Authorization: Bearer $TOKEN\""

