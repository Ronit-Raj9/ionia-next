#!/bin/bash

# Test API endpoints
# Make sure server is running before executing this script

BASE_URL="http://localhost:8000"
API_URL="$BASE_URL/api/v1"

echo "🧪 Testing LMS Backend API"
echo "=========================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: API Root
echo "2️⃣  Testing API Root..."
curl -s "$BASE_URL/" | jq '.'
echo ""

# Test 3: Register User
echo "3️⃣  Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@school.com",
    "password": "Test123!",
    "full_name": "Test User",
    "school_id": "TEST-SCHOOL"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Test 4: Login
echo "4️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@school.com",
    "password": "Test123!"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo ""
    echo "✅ Login successful! Token obtained."
    
    # Test 5: Get Current User
    echo ""
    echo "5️⃣  Testing Get Current User..."
    curl -s "$API_URL/auth/me" \
      -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Test 6: Protected Route
    echo ""
    echo "6️⃣  Testing Protected Route..."
    curl -s "$API_URL/protected/authenticated" \
      -H "Authorization: Bearer $TOKEN" | jq '.'
else
    echo "❌ Login failed - no token received"
fi

echo ""
echo "=========================="
echo "✅ API Tests Complete!"
echo ""
echo "💡 Tip: Use 'jq' for pretty JSON output"
echo "   Install: sudo apt install jq  (Linux)"
echo "   Install: brew install jq  (Mac)"

