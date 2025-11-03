#!/bin/bash
# Comprehensive AI Integration Test Script
# Tests all FastAPI <-> Next.js integrations

set -e

echo "🧪 Testing Ionia AI Integration"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_field=$5
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$url")
    else
        response=$(curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "📡 Step 1: Check FastAPI Service"
echo "--------------------------------"

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ FastAPI is running on port 8000${NC}"
else
    echo -e "${RED}✗ FastAPI is not running on port 8000${NC}"
    echo ""
    echo "Please start FastAPI first:"
    echo "  cd lms_ai/fastapi_server"
    echo "  python main.py"
    exit 1
fi

echo ""
echo "🤖 Step 2: Test AI Agents"
echo "------------------------"

# Test health endpoint
test_endpoint "Health Check" "GET" \
    "http://localhost:8000/health" \
    "" \
    "operational"

# Test GRADE agent
test_endpoint "GRADE Agent" "POST" \
    "http://localhost:8000/api/grade/evaluate-submission" \
    '{
        "submission": "The answer is 42",
        "questions": [{"_id": "q1", "text": "What is the answer?", "marks": 10}],
        "student_id": "test_student",
        "assignment_id": "test_assignment"
    }' \
    "success"

# Test ARC agent
test_endpoint "ARC Agent" "POST" \
    "http://localhost:8000/api/arc/personalize-assignment" \
    '{
        "student_profile": {
            "ocean": {"openness": 75, "conscientiousness": 60, "extraversion": 55, "agreeableness": 70, "neuroticism": 45},
            "learningPreferences": {"visual": 80, "auditory": 40, "kinesthetic": 50, "readingWriting": 60}
        },
        "questions": [{"_id": "q1", "text": "Solve x² + 5x + 6 = 0", "marks": 10}],
        "subject": "Mathematics",
        "difficulty_level": "medium"
    }' \
    "success"

# Test LENS agent
test_endpoint "LENS Agent" "POST" \
    "http://localhost:8000/api/lens/generate-lesson-plan" \
    '{
        "syllabus_text": "Grade 10 Physics: Electricity, Magnetism, Optics",
        "subject": "Physics",
        "grade": "10",
        "term": "Semester 1"
    }' \
    "success"

# Test EVENT agent - Schedule optimization
test_endpoint "EVENT Agent (Schedule)" "POST" \
    "http://localhost:8000/api/events/optimize-schedule" \
    '{
        "event_type": "test_scheduled",
        "scheduled_at": "2025-11-15T10:00:00Z",
        "duration": 90,
        "target_audience": {"classIds": ["class1"]}
    }' \
    "success"

# Test EVENT agent - Notification enhancement
test_endpoint "EVENT Agent (Notification)" "POST" \
    "http://localhost:8000/api/notifications/enhance" \
    '{
        "user_id": "student123",
        "title": "Assignment Graded",
        "message": "Your assignment has been graded",
        "type": "assignment_graded"
    }' \
    "success"

echo ""
echo "🔗 Step 3: Test Next.js Integration"
echo "-----------------------------------"

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Next.js is running on port 3001${NC}"
else
    echo -e "${YELLOW}⚠ Next.js is not running on port 3001${NC}"
    echo "  Note: Frontend tests skipped"
fi

echo ""
echo "📊 Test Results"
echo "==============="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Integration is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi

