#!/bin/bash

BASE_URL="http://localhost:8000"

echo "=== Testing AI Voice Clone Studio API ==="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""

# Test 2: Register User
echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test User"
  }')
echo $REGISTER_RESPONSE | python3 -m json.tool
echo ""

# Test 3: Login
echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123")
echo $LOGIN_RESPONSE | python3 -m json.tool

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo "Token: $TOKEN"
echo ""

# Test 4: Get Current User
echo "4. Testing Get Current User..."
curl -s "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test 5: Get Samples (should be empty)
echo "5. Testing Get Samples..."
curl -s "$BASE_URL/api/samples/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test 6: Get Library (should be empty)
echo "6. Testing Get Library..."
curl -s "$BASE_URL/api/library/all" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "=== All Basic Tests Complete ==="
