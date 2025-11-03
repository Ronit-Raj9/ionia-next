"""
GRADE Agent: Generative Remark & Assessment with Detailed Evaluation
Multi-agent workflow for comprehensive grading
"""
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import os
import logging

# Add praisonaiagents to path
PRAISONAI_PATH = Path(__file__).parent.parent.parent / "src" / "praisonai-agents"
sys.path.insert(0, str(PRAISONAI_PATH))

try:
    from praisonaiagents import Agent, Task, PraisonAIAgents
except ImportError:
    # Fallback if PraisonAI structure is different
    Agent = None
    Task = None
    PraisonAIAgents = None

logger = logging.getLogger(__name__)


class GradeAgent:
    """
    Multi-Agent Grading System:
    1. Grading Expert: Evaluates correctness and assigns scores
    2. Feedback Specialist: Generates constructive, personalized feedback
    3. Gap Analyzer: Identifies conceptual gaps and misconceptions
    """
    
    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "groq")
        self.model = os.getenv("GRADING_MODEL", "llama-3.1-70b-versatile")
        self.api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        
        # Initialize agents if PraisonAI is available
        if Agent:
            self._init_agents()
        else:
            logger.warning("PraisonAI not available, using fallback grading")
    
    def _init_agents(self):
        """Initialize the three grading agents"""
        try:
            # Agent 1: Grading Expert
            self.grading_agent = Agent(
                name="Grading Expert",
                role="Academic Grading Specialist",
                goal="Evaluate student submissions with precision and fairness",
                backstory="""You are an experienced academic grader with expertise across 
                multiple subjects. You evaluate student work objectively against rubrics, 
                ensuring consistent and fair scoring.""",
                llm=f"{self.llm_provider}/{self.model}",
                verbose=False
            )
            
            # Agent 2: Feedback Specialist
            self.feedback_agent = Agent(
                name="Feedback Specialist",
                role="Educational Feedback Expert",
                goal="Generate constructive, encouraging feedback that promotes learning",
                backstory="""You are an educational psychologist specializing in formative 
                feedback. You know how to motivate students while pointing out areas for 
                improvement in a supportive manner.""",
                llm=f"{self.llm_provider}/{self.model}",
                verbose=False
            )
            
            # Agent 3: Gap Analyzer
            self.analysis_agent = Agent(
                name="Gap Analyzer",
                role="Conceptual Understanding Analyst",
                goal="Identify specific knowledge gaps and misconceptions",
                backstory="""You are a cognitive science expert who analyzes student work 
                to identify underlying conceptual gaps, misconceptions, and areas requiring 
                remediation.""",
                llm=f"{self.llm_provider}/{self.model}",
                verbose=False
            )
            
            logger.info("GRADE agents initialized successfully")
        
        except Exception as e:
            logger.error(f"Error initializing GRADE agents: {str(e)}")
            self.grading_agent = None
            self.feedback_agent = None
            self.analysis_agent = None
    
    async def evaluate_submission(
        self,
        submission: str,
        questions: List[Dict[str, Any]],
        rubric: Optional[Dict[str, Any]],
        student_id: str,
        assignment_id: str
    ) -> Dict[str, Any]:
        """
        Complete multi-agent grading workflow
        """
        try:
            # Use multi-agent workflow if available
            if self.grading_agent and Agent and PraisonAIAgents:
                return await self._multi_agent_grading(
                    submission, questions, rubric, student_id, assignment_id
                )
            else:
                # Fallback to direct LLM grading
                return await self._fallback_grading(
                    submission, questions, rubric, student_id, assignment_id
                )
        
        except Exception as e:
            logger.error(f"Error in evaluate_submission: {str(e)}")
            # Return fallback result
            return await self._fallback_grading(
                submission, questions, rubric, student_id, assignment_id
            )
    
    async def _multi_agent_grading(
        self,
        submission: str,
        questions: List[Dict[str, Any]],
        rubric: Optional[Dict[str, Any]],
        student_id: str,
        assignment_id: str
    ) -> Dict[str, Any]:
        """Multi-agent grading workflow using PraisonAI"""
        
        try:
            # Prepare context
            context = self._prepare_grading_context(submission, questions, rubric)
            
            # Task 1: Grade the submission
            grading_task = Task(
                name="Grade Submission",
                description=f"""Evaluate this student submission against the provided questions and rubric:
                
                {context}
                
                Provide:
                1. Question-wise scores
                2. Total score and percentage
                3. Brief correctness notes for each question
                
                Return as JSON with structure:
                {{
                    "question_scores": [{{"question_id": "", "score": 0, "max_score": 0, "notes": ""}}],
                    "total_score": 0,
                    "max_score": 0,
                    "percentage": 0
                }}
                """,
                expected_output="JSON with detailed scoring",
                agent=self.grading_agent,
                async_execution=False
            )
            
            # Execute grading
            agents_system = PraisonAIAgents(
                agents=[self.grading_agent],
                tasks=[grading_task],
                process="sequential"
            )
            
            grading_result = agents_system.start()
            grading_data = self._parse_json_response(grading_result)
            
            # Task 2: Generate feedback
            feedback_task = Task(
                name="Generate Feedback",
                description=f"""Based on the grading results:
                {json.dumps(grading_data, indent=2)}
                
                And the original submission:
                {submission}
                
                Generate constructive, personalized feedback that:
                1. Acknowledges what the student did well
                2. Points out specific areas for improvement
                3. Provides encouragement
                4. Suggests concrete next steps
                
                Return as JSON:
                {{
                    "overall_feedback": "",
                    "question_feedback": [{{"question_id": "", "feedback": ""}}],
                    "strengths": [""],
                    "improvements": [""]
                }}
                """,
                expected_output="JSON with detailed feedback",
                agent=self.feedback_agent,
                async_execution=False
            )
            
            feedback_system = PraisonAIAgents(
                agents=[self.feedback_agent],
                tasks=[feedback_task],
                process="sequential"
            )
            
            feedback_result = feedback_system.start()
            feedback_data = self._parse_json_response(feedback_result)
            
            # Task 3: Analyze conceptual gaps
            analysis_task = Task(
                name="Analyze Gaps",
                description=f"""Analyze the student's submission and grading results:
                
                Submission: {submission}
                Grading: {json.dumps(grading_data, indent=2)}
                
                Identify:
                1. Specific conceptual gaps
                2. Misconceptions
                3. Topics requiring remediation
                4. Recommended resources
                
                Return as JSON:
                {{
                    "conceptual_gaps": [""],
                    "misconceptions": [""],
                    "weak_topics": [""],
                    "remediation_suggestions": [""],
                    "difficulty_assessment": "too_easy|appropriate|too_hard"
                }}
                """,
                expected_output="JSON with gap analysis",
                agent=self.analysis_agent,
                async_execution=False
            )
            
            analysis_system = PraisonAIAgents(
                agents=[self.analysis_agent],
                tasks=[analysis_task],
                process="sequential"
            )
            
            analysis_result = analysis_system.start()
            analysis_data = self._parse_json_response(analysis_result)
            
            # Combine results
            return {
                "success": True,
                "student_id": student_id,
                "assignment_id": assignment_id,
                "grading": grading_data,
                "feedback": feedback_data,
                "analysis": analysis_data,
                "graded_by": "multi-agent-system",
                "agents_used": ["Grading Expert", "Feedback Specialist", "Gap Analyzer"]
            }
        
        except Exception as e:
            logger.error(f"Error in multi-agent grading: {str(e)}")
            # Fallback to simple grading
            return await self._fallback_grading(
                submission, questions, rubric, student_id, assignment_id
            )
    
    async def _fallback_grading(
        self,
        submission: str,
        questions: List[Dict[str, Any]],
        rubric: Optional[Dict[str, Any]],
        student_id: str,
        assignment_id: str
    ) -> Dict[str, Any]:
        """Fallback grading using direct LLM calls (Groq/OpenAI)"""
        
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
            
            context = self._prepare_grading_context(submission, questions, rubric)
            
            prompt = f"""You are an expert grader. Evaluate this student submission:

{context}

Provide a comprehensive grading response with:
1. Question-wise scores
2. Detailed feedback
3. Conceptual gap analysis

Return ONLY a valid JSON object with this structure:
{{
    "grading": {{
        "question_scores": [{{"question_id": "", "score": 0, "max_score": 0, "notes": ""}}],
        "total_score": 0,
        "max_score": 0,
        "percentage": 0
    }},
    "feedback": {{
        "overall_feedback": "",
        "question_feedback": [{{"question_id": "", "feedback": ""}}],
        "strengths": [],
        "improvements": []
    }},
    "analysis": {{
        "conceptual_gaps": [],
        "misconceptions": [],
        "weak_topics": [],
        "remediation_suggestions": [],
        "difficulty_assessment": "appropriate"
    }}
}}"""

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert academic grader. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            result = self._parse_json_response(response.choices[0].message.content)
            result["success"] = True
            result["student_id"] = student_id
            result["assignment_id"] = assignment_id
            result["graded_by"] = "fallback-llm"
            
            return result
        
        except Exception as e:
            logger.error(f"Error in fallback grading: {str(e)}")
            # Return minimal result
            return {
                "success": False,
                "error": str(e),
                "student_id": student_id,
                "assignment_id": assignment_id,
                "grading": {
                    "total_score": 0,
                    "max_score": sum(q.get("marks", 0) for q in questions),
                    "percentage": 0
                },
                "feedback": {
                    "overall_feedback": "Grading error occurred. Please grade manually.",
                    "strengths": [],
                    "improvements": []
                },
                "analysis": {
                    "conceptual_gaps": [],
                    "weak_topics": []
                }
            }
    
    def _prepare_grading_context(
        self,
        submission: str,
        questions: List[Dict[str, Any]],
        rubric: Optional[Dict[str, Any]]
    ) -> str:
        """Prepare context for grading"""
        
        context = "=== QUESTIONS ===\n"
        for i, q in enumerate(questions, 1):
            context += f"\nQuestion {i} (ID: {q.get('_id', f'q{i}')}): {q.get('text', '')}\n"
            context += f"Type: {q.get('type', 'unknown')}\n"
            context += f"Marks: {q.get('marks', 0)}\n"
            
            if q.get('type') == 'mcq' and q.get('options'):
                context += f"Options: {', '.join(q['options'])}\n"
            
            if q.get('correctAnswer'):
                context += f"Correct Answer: {q['correctAnswer']}\n"
        
        context += f"\n=== STUDENT SUBMISSION ===\n{submission}\n"
        
        if rubric:
            context += f"\n=== RUBRIC ===\n{json.dumps(rubric, indent=2)}\n"
        
        return context
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from LLM response"""
        try:
            # Try direct parsing
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Try to find any JSON object
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            
            logger.error(f"Could not parse JSON from response: {response[:200]}")
            return {}

