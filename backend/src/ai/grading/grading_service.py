"""
Ionia AI Grading Service

This module provides AI-powered grading for student assignments including:
- Math problem grading with step-by-step feedback
- Science answer evaluation
- Essay/language grading
- Handwritten content recognition (via OCR)
"""

import os
import logging
from typing import Dict, List, Optional, Any
from ..agent.agent import Agent
from ..tools.python_tools import python_repl
from ..tools.calculator_tools import calculator

logger = logging.getLogger(__name__)


class GradingService:
    """
    AI-powered grading service for Ionia educational platform.
    Supports multiple subjects and provides detailed feedback.
    """
    
    def __init__(self, model: str = None):
        """
        Initialize grading service with specified AI model.
        
        Args:
            model: LiteLLM model name (e.g., "groq/llama-3.1-70b-versatile", 
                  "openai/gpt-4", "anthropic/claude-3-sonnet", etc.)
        """
        self.model = model or os.getenv("IONIA_GRADING_MODEL", "groq/llama-3.1-70b-versatile")
        
        # Create grading agent with appropriate tools
        self.grading_agent = Agent(
            name="GradingAgent",
            instructions="""You are an expert teacher and grader for K-12 students in India (CBSE/ICSE curriculum).
            
Your responsibilities:
1. Grade student answers accurately and fairly
2. Provide constructive, encouraging feedback
3. Explain where students went wrong and how to improve
4. Award partial marks for partially correct answers
5. Be culturally sensitive and supportive

Grading Guidelines:
- Math: Check calculations step-by-step, award marks for correct method even if final answer is wrong
- Science: Look for conceptual understanding, not just memorization
- Language: Check grammar, clarity, coherence, and content
- Always explain your grading reasoning
""",
            tools=[python_repl, calculator],
            model=self.model,
            verbose=True
        )
    
    def grade_math_assignment(
        self,
        question: str,
        student_answer: str,
        max_marks: int = 10,
        topic: str = None
    ) -> Dict[str, Any]:
        """
        Grade a math assignment with detailed feedback.
        
        Args:
            question: The math question/problem
            student_answer: Student's answer (can be text or from OCR)
            max_marks: Maximum marks for this question
            topic: Math topic (e.g., "algebra", "geometry", "fractions")
        
        Returns:
            Dict containing marks_awarded, feedback, step_by_step_analysis
        """
        prompt = f"""Grade this math problem for a student:

**Question ({max_marks} marks):**
{question}

**Topic:** {topic or "General Mathematics"}

**Student's Answer:**
{student_answer}

**Instructions:**
1. Check if the answer is correct
2. If the method is correct but answer wrong, give partial marks
3. Explain step-by-step where the student went right/wrong
4. Provide encouragement and suggestions for improvement
5. Award marks out of {max_marks}

Respond in JSON format:
{{
    "marks_awarded": <number>,
    "is_correct": <boolean>,
    "feedback": "<detailed feedback>",
    "mistakes_identified": ["<mistake 1>", "<mistake 2>"],
    "improvement_suggestions": ["<suggestion 1>", "<suggestion 2>"],
    "step_by_step_analysis": "<analysis>"
}}
"""
        
        try:
            result = self.grading_agent.start(prompt)
            # Parse JSON from result
            import json
            # Extract JSON from response (handle markdown code blocks)
            response_text = result.raw if hasattr(result, 'raw') else str(result)
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text
            
            grading_result = json.loads(json_str)
            grading_result["subject"] = "mathematics"
            grading_result["topic"] = topic
            return grading_result
            
        except Exception as e:
            logger.error(f"Error grading math assignment: {e}")
            return {
                "marks_awarded": 0,
                "is_correct": False,
                "feedback": f"Error during grading: {str(e)}",
                "mistakes_identified": [],
                "improvement_suggestions": [],
                "step_by_step_analysis": ""
            }
    
    def grade_science_assignment(
        self,
        question: str,
        student_answer: str,
        max_marks: int = 10,
        topic: str = None
    ) -> Dict[str, Any]:
        """
        Grade a science assignment (Physics, Chemistry, Biology).
        
        Args:
            question: The science question
            student_answer: Student's answer
            max_marks: Maximum marks
            topic: Science topic
        
        Returns:
            Grading result with feedback
        """
        prompt = f"""Grade this science answer for a student:

**Question ({max_marks} marks):**
{question}

**Topic:** {topic or "General Science"}

**Student's Answer:**
{student_answer}

**Instructions:**
1. Check for conceptual understanding
2. Look for key scientific terms and explanations
3. Award marks for diagrams/labels if mentioned
4. Provide feedback on accuracy and completeness
5. Award marks out of {max_marks}

Respond in JSON format:
{{
    "marks_awarded": <number>,
    "is_correct": <boolean>,
    "feedback": "<detailed feedback>",
    "key_points_covered": ["<point 1>", "<point 2>"],
    "key_points_missed": ["<point 1>", "<point 2>"],
    "improvement_suggestions": ["<suggestion 1>"],
    "conceptual_understanding": "<assessment>"
}}
"""
        
        try:
            result = self.grading_agent.start(prompt)
            import json
            response_text = result.raw if hasattr(result, 'raw') else str(result)
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text
            
            grading_result = json.loads(json_str)
            grading_result["subject"] = "science"
            grading_result["topic"] = topic
            return grading_result
            
        except Exception as e:
            logger.error(f"Error grading science assignment: {e}")
            return {
                "marks_awarded": 0,
                "is_correct": False,
                "feedback": f"Error during grading: {str(e)}",
                "key_points_covered": [],
                "key_points_missed": [],
                "improvement_suggestions": [],
                "conceptual_understanding": ""
            }
    
    def batch_grade_assignments(
        self,
        assignments: List[Dict[str, Any]],
        subject: str = "mathematics"
    ) -> List[Dict[str, Any]]:
        """
        Grade multiple assignments in batch.
        
        Args:
            assignments: List of dicts with 'question', 'student_answer', 'max_marks'
            subject: Subject type ("mathematics" or "science")
        
        Returns:
            List of grading results
        """
        results = []
        for idx, assignment in enumerate(assignments):
            logger.info(f"Grading assignment {idx + 1}/{len(assignments)}")
            
            if subject == "mathematics":
                result = self.grade_math_assignment(
                    question=assignment.get("question"),
                    student_answer=assignment.get("student_answer"),
                    max_marks=assignment.get("max_marks", 10),
                    topic=assignment.get("topic")
                )
            elif subject == "science":
                result = self.grade_science_assignment(
                    question=assignment.get("question"),
                    student_answer=assignment.get("student_answer"),
                    max_marks=assignment.get("max_marks", 10),
                    topic=assignment.get("topic")
                )
            else:
                result = {"error": f"Unsupported subject: {subject}"}
            
            result["assignment_id"] = assignment.get("id")
            result["student_id"] = assignment.get("student_id")
            results.append(result)
        
        return results


# Example usage
if __name__ == "__main__":
    # Set up environment
    os.environ["OPENAI_API_KEY"] = os.getenv("GROQ_API_KEY")  # Use Groq
    os.environ["OPENAI_BASE_URL"] = "https://api.groq.com/openai/v1"
    
    # Initialize grading service
    grader = GradingService(model="groq/llama-3.1-70b-versatile")
    
    # Example: Grade a math problem
    result = grader.grade_math_assignment(
        question="Solve: 2x + 5 = 13. Find the value of x.",
        student_answer="2x = 13 - 5, 2x = 8, x = 4",
        max_marks=5,
        topic="Linear Equations"
    )
    
    print("Grading Result:")
    print(f"Marks: {result['marks_awarded']}/5")
    print(f"Feedback: {result['feedback']}")

