"""
FastAPI AI Service for Ionia LMS
Multi-Agent AI system using PraisonAI framework
"""
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging
import os
from dotenv import load_dotenv

# Add praisonaiagents to Python path (direct use without package install)
PRAISONAI_PATH = Path(__file__).parent.parent / "src" / "praisonai-agents"
sys.path.insert(0, str(PRAISONAI_PATH))

# Import agents
from agents.grade_agent import GradeAgent
from agents.arc_agent import ARCAgent
from agents.lens_agent import LENSAgent
from agents.event_agent import EVENTAgent

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Ionia AI Service",
    description="Multi-Agent AI system for adaptive learning and assessment",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
grade_agent = GradeAgent()
arc_agent = ARCAgent()
lens_agent = LENSAgent()
event_agent = EVENTAgent()

# ==================== Pydantic Models ====================

class GradeSubmissionRequest(BaseModel):
    submission: str
    questions: List[Dict[str, Any]]
    rubric: Optional[Dict[str, Any]] = None
    student_id: str
    assignment_id: str

class PersonalizeAssignmentRequest(BaseModel):
    student_profile: Dict[str, Any]
    questions: List[Dict[str, Any]]
    subject: str
    difficulty_level: Optional[str] = "medium"

class AdjustDifficultyRequest(BaseModel):
    student_id: str
    performance_history: List[Dict[str, Any]]
    current_difficulty: str

class GenerateLessonPlanRequest(BaseModel):
    syllabus_text: str
    subject: str
    grade: str
    term: Optional[str] = "Full Year"

class AnalyzeStudentRequest(BaseModel):
    student_id: str
    submission_history: List[Dict[str, Any]]
    current_mastery: Dict[str, Any]

class OptimizeScheduleRequest(BaseModel):
    event_type: str
    scheduled_at: str
    duration: int
    target_audience: Dict[str, Any]
    assignment_id: Optional[str] = None
    student_performance_data: Optional[List[Dict[str, Any]]] = None

class EnhanceNotificationRequest(BaseModel):
    user_id: str
    title: str
    message: str
    type: str
    data: Optional[Dict[str, Any]] = None

# ==================== Health Check ====================

@app.get("/")
async def root():
    return {
        "service": "Ionia AI Service",
        "status": "running",
        "version": "1.0.0",
        "agents": ["GRADE", "ARC", "LENS", "EVENT"]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agents": {
            "grade": "operational",
            "arc": "operational",
            "lens": "operational",
            "event": "operational"
        }
    }

# ==================== GRADE Agent Endpoints ====================

@app.post("/api/grade/evaluate-submission")
async def evaluate_submission(request: GradeSubmissionRequest):
    """
    Multi-agent grading workflow:
    1. Grading Agent: Evaluates against rubric
    2. Feedback Agent: Generates constructive feedback
    3. Analysis Agent: Identifies conceptual gaps
    """
    try:
        logger.info(f"Grading submission for student {request.student_id}")
        
        result = await grade_agent.evaluate_submission(
            submission=request.submission,
            questions=request.questions,
            rubric=request.rubric,
            student_id=request.student_id,
            assignment_id=request.assignment_id
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in evaluate_submission: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/grade/batch-evaluate")
async def batch_evaluate(submissions: List[GradeSubmissionRequest]):
    """Batch grading for multiple submissions"""
    try:
        results = []
        for submission in submissions:
            result = await grade_agent.evaluate_submission(
                submission=submission.submission,
                questions=submission.questions,
                rubric=submission.rubric,
                student_id=submission.student_id,
                assignment_id=submission.assignment_id
            )
            results.append(result)
        
        return {"results": results, "total": len(results)}
    
    except Exception as e:
        logger.error(f"Error in batch_evaluate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ARC Agent Endpoints ====================

@app.post("/api/arc/personalize-assignment")
async def personalize_assignment(request: PersonalizeAssignmentRequest):
    """
    Adaptive personalization based on student profile:
    - OCEAN personality traits
    - Learning preferences
    - Performance history
    - Cognitive style
    """
    try:
        logger.info(f"Personalizing assignment for student profile")
        
        result = await arc_agent.personalize_questions(
            student_profile=request.student_profile,
            questions=request.questions,
            subject=request.subject,
            difficulty_level=request.difficulty_level
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in personalize_assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/arc/adjust-difficulty")
async def adjust_difficulty(request: AdjustDifficultyRequest):
    """
    Dynamic difficulty adjustment based on performance:
    - Analyzes performance trends
    - Identifies optimal challenge level
    - Maintains flow state (not too easy, not too hard)
    """
    try:
        logger.info(f"Adjusting difficulty for student {request.student_id}")
        
        result = await arc_agent.adjust_difficulty(
            student_id=request.student_id,
            performance_history=request.performance_history,
            current_difficulty=request.current_difficulty
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in adjust_difficulty: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/arc/analyze-student")
async def analyze_student(request: AnalyzeStudentRequest):
    """
    Deep student analysis:
    - Learning patterns
    - Weak areas
    - Optimal learning time
    - Cognitive load management
    """
    try:
        logger.info(f"Analyzing student {request.student_id}")
        
        result = await arc_agent.analyze_student(
            student_id=request.student_id,
            submission_history=request.submission_history,
            current_mastery=request.current_mastery
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in analyze_student: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== LENS Agent Endpoints ====================

@app.post("/api/lens/generate-lesson-plan")
async def generate_lesson_plan(request: GenerateLessonPlanRequest):
    """
    AI Lesson Planning:
    - Parses syllabus
    - Generates balanced topic coverage
    - Creates timeline
    - Generates aligned question papers
    """
    try:
        logger.info(f"Generating lesson plan for {request.subject} Grade {request.grade}")
        
        result = await lens_agent.generate_lesson_plan(
            syllabus_text=request.syllabus_text,
            subject=request.subject,
            grade=request.grade,
            term=request.term
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in generate_lesson_plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lens/parse-syllabus")
async def parse_syllabus(file: UploadFile = File(...)):
    """
    Parse syllabus PDF/DOCX:
    - Extracts topics and subtopics
    - Identifies learning objectives
    - Maps to question types
    """
    try:
        logger.info(f"Parsing syllabus file: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        result = await lens_agent.parse_syllabus(
            file_content=content,
            filename=file.filename
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in parse_syllabus: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lens/generate-questions")
async def generate_questions(
    topic: str,
    subject: str,
    difficulty: str,
    count: int = 10,
    question_types: Optional[List[str]] = None
):
    """
    Generate questions for specific topic:
    - Balanced difficulty distribution
    - Multiple question types
    - Aligned with learning objectives
    """
    try:
        logger.info(f"Generating {count} questions for {topic}")
        
        result = await lens_agent.generate_questions(
            topic=topic,
            subject=subject,
            difficulty=difficulty,
            count=count,
            question_types=question_types or ["mcq", "short_answer", "long_answer"]
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in generate_questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Combined Workflows ====================

@app.post("/api/workflow/complete-grading-cycle")
async def complete_grading_cycle(request: GradeSubmissionRequest):
    """
    Complete grading + analysis + personalization workflow:
    1. Grade the submission
    2. Analyze performance patterns
    3. Generate personalized next assignment
    """
    try:
        # Step 1: Grade
        grade_result = await grade_agent.evaluate_submission(
            submission=request.submission,
            questions=request.questions,
            rubric=request.rubric,
            student_id=request.student_id,
            assignment_id=request.assignment_id
        )
        
        # Step 2: Analyze (using grade result)
        analysis = await arc_agent.analyze_from_grading(
            student_id=request.student_id,
            grading_result=grade_result
        )
        
        # Step 3: Generate next personalized assignment
        next_assignment = await arc_agent.generate_next_assignment(
            student_id=request.student_id,
            analysis=analysis
        )
        
        return {
            "grading": grade_result,
            "analysis": analysis,
            "next_assignment": next_assignment
        }
    
    except Exception as e:
        logger.error(f"Error in complete_grading_cycle: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== EVENT Agent Endpoints ====================

@app.post("/api/events/optimize-schedule")
async def optimize_event_schedule(request: OptimizeScheduleRequest):
    """
    AI-powered event scheduling optimization:
    - Analyzes optimal timing based on student patterns
    - Suggests preparation time needed
    - Generates smart reminder schedule
    - Assesses student readiness
    """
    try:
        logger.info(f"Optimizing schedule for {request.event_type}")
        
        result = await event_agent.optimize_schedule(
            event_type=request.event_type,
            scheduled_at=request.scheduled_at,
            duration=request.duration,
            target_audience=request.target_audience,
            assignment_id=request.assignment_id,
            student_performance_data=request.student_performance_data
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in optimize_event_schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notifications/enhance")
async def enhance_notification(request: EnhanceNotificationRequest):
    """
    AI-powered notification enhancement:
    - Personalizes message content
    - Determines optimal sentiment
    - Suggests best delivery time
    - Calculates urgency score
    """
    try:
        logger.info(f"Enhancing notification for user {request.user_id}")
        
        result = await event_agent.enhance_notification(
            user_id=request.user_id,
            title=request.title,
            message=request.message,
            notification_type=request.type,
            data=request.data
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error in enhance_notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Run Server ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

