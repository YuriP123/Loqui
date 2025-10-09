#!/bin/bash

echo "🧪 AI Voice Clone Studio - Full System Test"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local headers=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" $headers -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" $headers)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" == 2* ]]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Health Check
echo "📊 System Health Checks"
echo "----------------------"
test_endpoint "Health Check" "GET" "/health"
echo ""

# Test 2: Register User
echo "👤 User Management"
echo "-------------------"
TIMESTAMP=$(date +%s)
test_endpoint "Register User" "POST" "/api/auth/register" '{
    "username": "testuser'$TIMESTAMP'",
    "email": "test'$TIMESTAMP'@example.com",
    "password": "testpass123",
    "full_name": "Test User"
}'

# Test 3: Login
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser$TIMESTAMP&password=testpass123")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed - cannot continue tests${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 4: Get Current User
echo "🔐 Authentication"
echo "------------------"
test_endpoint "Get Current User" "GET" "/api/auth/me" "" "-H 'Authorization: Bearer $TOKEN'"
echo ""

# Test 5: Check if we can create a generation without samples
echo "🎙️  Generation System"
echo "---------------------"
echo "Testing generation (should fail - no samples)..."
curl -s -X POST "$BASE_URL/api/generation/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": 999,
    "model_name": "Test Model",
    "script_text": "This should fail because sample does not exist."
  }' | python3 -m json.tool

echo ""

# Test 6: Library
echo "📚 Library System"
echo "------------------"
test_endpoint "Get All Library Items" "GET" "/api/library/all" "" "-H 'Authorization: Bearer $TOKEN'"
test_endpoint "Get Samples Only" "GET" "/api/library/samples" "" "-H 'Authorization: Bearer $TOKEN'"
test_endpoint "Get Generated Only" "GET" "/api/library/generated" "" "-H 'Authorization: Bearer $TOKEN'"
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
