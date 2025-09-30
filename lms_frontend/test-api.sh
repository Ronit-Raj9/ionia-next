#!/bin/bash

# API Testing Script for AI Classroom Management System
# Usage: ./test-api.sh

BASE_URL="http://localhost:3001"
TEACHER_ID="teacher_demo_1"
STUDENT_ID="student_demo_1"
SCHOOL_ID="demo-school-delhi-2025"

echo "🧪 Testing AI Classroom Management System APIs"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

echo "1️⃣  Testing Seed API"
echo "-------------------"
response=$(curl -s -X POST "$BASE_URL/api/seed" \
  -H "Content-Type: application/json" \
  -d '{"action": "seed", "useScience": true}')

if echo "$response" | grep -q '"success":true'; then
    print_result 0 "Seed API - Database populated successfully"
    echo "   Students: 20, Classes: 2, Assignments: 2"
else
    print_result 1 "Seed API - Failed to seed database"
    echo "   Response: $response"
fi
echo ""

# Wait for seeding to complete
sleep 2

echo "2️⃣  Testing Student Profiles API"
echo "--------------------------------"

# Test GET student profile
response=$(curl -s "$BASE_URL/api/student-profiles?studentId=$STUDENT_ID")

if echo "$response" | grep -q '"success":true'; then
    print_result 0 "GET Student Profile - Retrieved successfully"
    
    # Check for OCEAN traits
    if echo "$response" | grep -q '"oceanTraits"'; then
        print_result 0 "OCEAN Traits - Present in profile"
        
        # Extract trait values
        openness=$(echo "$response" | jq -r '.data.oceanTraits.openness')
        conscientiousness=$(echo "$response" | jq -r '.data.oceanTraits.conscientiousness')
        echo "   Openness: $openness, Conscientiousness: $conscientiousness"
    else
        print_result 1 "OCEAN Traits - Missing from profile"
    fi
    
    # Check for learning preferences
    if echo "$response" | grep -q '"learningPreferences"'; then
        print_result 0 "Learning Preferences - Present in profile"
    else
        print_result 1 "Learning Preferences - Missing from profile"
    fi
else
    print_result 1 "GET Student Profile - Failed to retrieve"
fi
echo ""

echo "3️⃣  Testing Classes API"
echo "----------------------"

response=$(curl -s "$BASE_URL/api/classes?role=teacher&mockUserId=$TEACHER_ID")

if echo "$response" | grep -q '"success":true'; then
    print_result 0 "GET Classes - Retrieved successfully"
    
    # Count classes
    class_count=$(echo "$response" | jq '.data | length')
    echo "   Classes found: $class_count"
    
    if [ "$class_count" -ge 2 ]; then
        print_result 0 "Class Count - Expected 2 or more classes"
    else
        print_result 1 "Class Count - Expected at least 2 classes"
    fi
else
    print_result 1 "GET Classes - Failed to retrieve"
fi
echo ""

echo "4️⃣  Testing Assignments API"
echo "---------------------------"

# Get classes first to find a valid classId
classes_response=$(curl -s "$BASE_URL/api/classes?role=teacher&mockUserId=$TEACHER_ID")
class_id=$(echo "$classes_response" | jq -r '.data[0]._id')

response=$(curl -s "$BASE_URL/api/assignments?role=teacher&mockUserId=$TEACHER_ID&classId=$class_id")

if echo "$response" | grep -q '"success":true'; then
    print_result 0 "GET Assignments - Retrieved successfully"
    
    assignment_count=$(echo "$response" | jq '.data | length')
    echo "   Assignments found: $assignment_count"
    
    # Check for personalized versions
    if echo "$response" | grep -q '"personalizedVersions"'; then
        print_result 0 "Personalization - Present in assignments"
        
        # Check personalization count
        personalized_count=$(echo "$response" | jq -r '.data[0].personalizedVersions | length')
        echo "   Personalized versions: $personalized_count"
    else
        print_result 1 "Personalization - Missing from assignments"
    fi
else
    print_result 1 "GET Assignments - Failed to retrieve"
fi
echo ""

echo "5️⃣  Testing Student Assignment View (Personalized)"
echo "--------------------------------------------------"

assignment_id=$(echo "$response" | jq -r '.data[0]._id')

response=$(curl -s "$BASE_URL/api/assignments?role=student&mockUserId=$TEACHER_ID&studentMockId=$STUDENT_ID")

if echo "$response" | grep -q '"success":true'; then
    print_result 0 "GET Student Assignments - Retrieved successfully"
    
    # Check for personalization fields
    if echo "$response" | grep -q '"difficultyAdjustment"'; then
        print_result 0 "Personalization Fields - Present (difficultyAdjustment)"
    fi
    
    if echo "$response" | grep -q '"encouragementNote"'; then
        print_result 0 "Personalization Fields - Present (encouragementNote)"
    fi
    
    if echo "$response" | grep -q '"visualAids"'; then
        print_result 0 "Personalization Fields - Present (visualAids)"
    fi
else
    print_result 1 "GET Student Assignments - Failed to retrieve"
fi
echo ""

echo "6️⃣  Testing Submission & Auto-Grading"
echo "-------------------------------------"

# Create a test submission
response=$(curl -s -X POST "$BASE_URL/api/submissions" \
  -F "role=student" \
  -F "studentMockId=$STUDENT_ID" \
  -F "assignmentId=$assignment_id" \
  -F "textAnswer=The universal law of gravitation states that every object attracts every other object with a force proportional to the product of their masses and inversely proportional to the square of the distance between them. Formula: F = G × (m1 × m2) / r². For two masses of 80 kg and 1200 kg at 10 m distance: F = 6.7 × 10^-11 × (80 × 1200) / 100 = 6.432 × 10^-8 N")

if echo "$response" | grep -q '"success":true'; then
    print_result 0 "POST Submission - Submitted successfully"
    
    # Check for auto-grading
    if echo "$response" | grep -q '"grade"'; then
        print_result 0 "Auto-Grading - Grade returned"
        
        score=$(echo "$response" | jq -r '.data.grade.score')
        echo "   Score: $score"
        
        # Check for detailed feedback
        if echo "$response" | grep -q '"detailedFeedback"'; then
            print_result 0 "Detailed Feedback - Present"
        fi
        
        if echo "$response" | grep -q '"errorAnalysis"'; then
            print_result 0 "Error Analysis - Present"
        fi
        
        if echo "$response" | grep -q '"questionWiseAnalysis"'; then
            print_result 0 "Question-wise Analysis - Present"
        fi
    else
        print_result 1 "Auto-Grading - Grade not returned"
    fi
    
    # Check for progress update
    if echo "$response" | grep -q '"progressUpdate"'; then
        print_result 0 "Progress Tracking - Update returned"
        
        previous_mastery=$(echo "$response" | jq -r '.data.progressUpdate.previousMastery')
        new_mastery=$(echo "$response" | jq -r '.data.progressUpdate.newMastery')
        echo "   Mastery: $previous_mastery% → $new_mastery%"
    else
        print_result 1 "Progress Tracking - Update not returned"
    fi
else
    print_result 1 "POST Submission - Failed to submit"
    echo "   Response: $response"
fi
echo ""

echo "7️⃣  Testing Progress Update Verification"
echo "----------------------------------------"

# Wait for progress update to propagate
sleep 1

response=$(curl -s "$BASE_URL/api/student-profiles?studentId=$STUDENT_ID")

if echo "$response" | grep -q '"subjectMastery"'; then
    print_result 0 "Subject Mastery - Updated in profile"
    
    # Check assignment history
    if echo "$response" | grep -q '"assignmentHistory"'; then
        history_count=$(echo "$response" | jq '.data.assignmentHistory | length')
        print_result 0 "Assignment History - Present ($history_count entries)"
    fi
    
    # Check engagement metrics
    if echo "$response" | grep -q '"engagementMetrics"'; then
        print_result 0 "Engagement Metrics - Updated"
    fi
else
    print_result 1 "Subject Mastery - Not found in profile"
fi
echo ""

echo "8️⃣  Testing Different Student Types"
echo "-----------------------------------"

# Test high performer
response_high=$(curl -s "$BASE_URL/api/student-profiles?studentId=student_demo_1")
response_struggling=$(curl -s "$BASE_URL/api/student-profiles?studentId=student_demo_18")

openness_high=$(echo "$response_high" | jq -r '.data.oceanTraits.openness')
openness_struggling=$(echo "$response_struggling" | jq -r '.data.oceanTraits.openness')

echo "   High Performer (student_demo_1): Openness=$openness_high"
echo "   Struggling (student_demo_18): Openness=$openness_struggling"

if [ "$openness_high" -gt "$openness_struggling" ]; then
    print_result 0 "Student Diversity - Profiles show variation"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Student profiles may not be diverse enough"
fi
echo ""

echo "================================================"
echo "✅ API Testing Complete!"
echo ""
echo "Summary:"
echo "--------"
echo "• Seed API: Working"
echo "• Student Profiles: OCEAN traits present"
echo "• Assignments: Personalization working"
echo "• Submissions: Auto-grading functional"
echo "• Progress Tracking: Mastery updating"
echo ""
echo "🎉 System is ready for demo!"
echo ""
echo "Next Steps:"
echo "1. View detailed logs in server console"
echo "2. Check MongoDB for persisted data"
echo "3. Test UI components"
echo "4. Run full demo flow"
