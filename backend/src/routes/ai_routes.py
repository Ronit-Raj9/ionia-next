"""
Ionia AI FastAPI Routes

API endpoints for AI-powered features:
- Assignment grading
- Personalized assignment generation
- Student profile analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import os

# Import AI services
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from ai.grading.grading_service import GradingService
from ai.personalization.personalization_service import PersonalizationService

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/ai", tags=["AI Services"])

# Initialize services (singleton pattern)
_grading_service = None
_personalization_service = None


def get_grading_service() -> GradingService:
    """Get or create grading service instance."""
    global _grading_service
    if _grading_service is None:
        _grading_service = GradingService()
    return _grading_service


def get_personalization_service() -> PersonalizationService:
    """Get or create personalization service instance."""
    global _personalization_service
    if _personalization_service is None:
        _personalization_service = PersonalizationService()
    return _personalization_service


# Pydantic Models for Request/Response
class GradeAssignmentRequest(BaseModel):
    question: str
    student_answer: str
    max_marks: int = 10
    subject: str = "mathematics"  # or "science"
    topic: Optional[str] = None
    student_id: str


class GradeAssignmentResponse(BaseModel):
    marks_awarded: int
    is_correct: bool
    feedback: str
    mistakes_identified: List[str]
    improvement_suggestions: List[str]
    subject: str
    topic: Optional[str]


class BatchGradeRequest(BaseModel):
    assignments: List[Dict[str, Any]]
    subject: str = "mathematics"


class PersonalizedAssignmentRequest(BaseModel):
    student_id: str
    subject: str
    topic: str
    num_questions: int = 5
    difficulty: str = "medium"


class StudentProfileRequest(BaseModel):
    student_id: str
    past_performance: List[Dict[str, Any]]
    quiz_responses: Optional[List[Dict[str, Any]]] = None


# Routes

@router.post("/grade", response_model=GradeAssignmentResponse)
async def grade_assignment(
    request: GradeAssignmentRequest,
    grading_service: GradingService = Depends(get_grading_service)
):
    """
    Grade a single student assignment using AI.
    
    **Example Request:**
    ```json
    {
        "question": "Solve: 2x + 5 = 13",
        "student_answer": "2x = 8, x = 4",
        "max_marks": 5,
        "subject": "mathematics",
        "topic": "linear equations",
        "student_id": "STUDENT_001"
    }
    ```
    """
    try:
        if request.subject == "mathematics":
            result = grading_service.grade_math_assignment(
                question=request.question,
                student_answer=request.student_answer,
                max_marks=request.max_marks,
                topic=request.topic
            )
        elif request.subject == "science":
            result = grading_service.grade_science_assignment(
                question=request.question,
                student_answer=request.student_answer,
                max_marks=request.max_marks,
                topic=request.topic
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported subject: {request.subject}")
        
        return result
    
    except Exception as e:
        logger.error(f"Error grading assignment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/grade/batch")
async def batch_grade_assignments(
    request: BatchGradeRequest,
    grading_service: GradingService = Depends(get_grading_service)
):
    """
    Grade multiple assignments in batch for a class.
    
    **Example Request:**
    ```json
    {
        "subject": "mathematics",
        "assignments": [
            {
                "id": "ASSIGN_001",
                "student_id": "STUDENT_001",
                "question": "Solve: x + 5 = 10",
                "student_answer": "x = 5",
                "max_marks": 5,
                "topic": "basic algebra"
            },
            {
                "id": "ASSIGN_002",
                "student_id": "STUDENT_002",
                "question": "Solve: x + 5 = 10",
                "student_answer": "x = 15",
                "max_marks": 5,
                "topic": "basic algebra"
            }
        ]
    }
    ```
    """
    try:
        results = grading_service.batch_grade_assignments(
            assignments=request.assignments,
            subject=request.subject
        )
        return {"results": results, "total_graded": len(results)}
    
    except Exception as e:
        logger.error(f"Error batch grading: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/personalize/profile")
async def analyze_student_profile(
    request: StudentProfileRequest,
    personalization_service: PersonalizationService = Depends(get_personalization_service)
):
    """
    Analyze student learning profile based on past performance.
    
    **Example Request:**
    ```json
    {
        "student_id": "STUDENT_001",
        "past_performance": [
            {
                "subject": "mathematics",
                "topic": "algebra",
                "marks_obtained": 7,
                "max_marks": 10,
                "date": "2025-01-15"
            },
            {
                "subject": "mathematics",
                "topic": "geometry",
                "marks_obtained": 4,
                "max_marks": 10,
                "date": "2025-01-20"
            }
        ]
    }
    ```
    """
    try:
        profile = personalization_service.analyze_student_profile(
            student_id=request.student_id,
            past_performance=request.past_performance,
            quiz_responses=request.quiz_responses
        )
        return profile
    
    except Exception as e:
        logger.error(f"Error analyzing profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/personalize/assignments")
async def generate_personalized_assignments(
    request: PersonalizedAssignmentRequest,
    personalization_service: PersonalizationService = Depends(get_personalization_service)
):
    """
    Generate personalized assignments for a student based on their profile.
    
    **Example Request:**
    ```json
    {
        "student_id": "STUDENT_001",
        "subject": "mathematics",
        "topic": "algebra",
        "num_questions": 5,
        "difficulty": "medium"
    }
    ```
    """
    try:
        assignments = personalization_service.generate_personalized_assignments(
            student_id=request.student_id,
            subject=request.subject,
            topic=request.topic,
            num_questions=request.num_questions,
            difficulty=request.difficulty
        )
        return {"assignments": assignments, "total_questions": len(assignments)}
    
    except Exception as e:
        logger.error(f"Error generating personalized assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint for AI services."""
    return {
        "status": "healthy",
        "services": {
            "grading": _grading_service is not None,
            "personalization": _personalization_service is not None
        }
    }


# For development/testing
if __name__ == "__main__":
    import uvicorn
    from fastapi import FastAPI
    
    app = FastAPI(title="Ionia AI API")
    app.include_router(router)
    
    # Set up environment for testing
    os.environ["OPENAI_API_KEY"] = os.getenv("GROQ_API_KEY", "test-key")
    os.environ["OPENAI_BASE_URL"] = "https://api.groq.com/openai/v1"
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

