"""
Ionia AI Personalization Service

This module handles:
- Student profile analysis (personality, intellectual traits)
- Personalized assignment generation based on past performance
- Adaptive difficulty adjustment
- Learning style identification
"""

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from ..agent.agent import Agent
from ..memory.memory import Memory
from ..knowledge.knowledge import Knowledge

logger = logging.getLogger(__name__)


class PersonalizationService:
    """
    Personalization service for Ionia that adapts content to each student.
    """
    
    def __init__(self, model: str = None):
        """
        Initialize personalization service.
        
        Args:
            model: LiteLLM model name
        """
        self.model = model or os.getenv("IONIA_PERSONALIZATION_MODEL", "groq/llama-3.1-70b-versatile")
        
        # Initialize memory for student profiles
        self.memory = Memory(config={
            "provider": "supabase",
            "supabase_url": os.getenv("SUPABASE_URL"),
            "supabase_key": os.getenv("SUPABASE_KEY"),
        })
        
        # Initialize knowledge base for CBSE content
        self.knowledge = Knowledge(config={
            "vector_store": {
                "provider": "qdrant",
                "config": {
                    "url": os.getenv("QDRANT_URL", "http://localhost:6333"),
                    "collection_name": "cbse_questions"
                }
            }
        })
        
        # Create personalization agent
        self.personalization_agent = Agent(
            name="PersonalizationAgent",
            instructions="""You are an AI educational psychologist and curriculum designer for Indian K-12 students.

Your role:
1. Analyze student performance patterns
2. Identify learning styles (visual, auditory, kinesthetic, reading/writing)
3. Assess personality traits (collaborative, independent, competitive, curious)
4. Determine cognitive strengths (analytical, creative, practical)
5. Generate personalized learning recommendations

Always be:
- Culturally sensitive to Indian educational context
- Encouraging and positive
- Data-driven in your analysis
- Adaptive to student progress
""",
            model=self.model,
            verbose=True
        )
    
    def analyze_student_profile(
        self,
        student_id: str,
        past_performance: List[Dict[str, Any]],
        quiz_responses: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Analyze student's learning profile based on past performance.
        
        Args:
            student_id: Unique student identifier
            past_performance: List of past assignment results
            quiz_responses: Optional personality/learning style quiz responses
        
        Returns:
            Student profile with personality, intellectual traits, and learning style
        """
        # Build analysis prompt
        performance_summary = self._summarize_performance(past_performance)
        
        prompt = f"""Analyze this student's learning profile:

**Student ID:** {student_id}

**Past Performance Summary:**
{performance_summary}

**Quiz Responses:** {quiz_responses or "Not available"}

Based on the data, provide a comprehensive learning profile:

1. **Learning Style** (Visual, Auditory, Kinesthetic, Reading/Writing or combination)
2. **Personality Traits** (e.g., Collaborative, Independent, Detail-oriented, Creative)
3. **Cognitive Strengths** (Analytical, Creative, Practical, Social)
4. **Subject Strengths** (Which subjects/topics they excel in)
5. **Areas for Improvement** (Specific weaknesses to address)
6. **Recommended Teaching Approach** (How to best teach this student)
7. **Motivation Factors** (What motivates this student)

Respond in JSON format:
{{
    "learning_style": {{
        "primary": "<style>",
        "secondary": "<style>",
        "description": "<explanation>"
    }},
    "personality_traits": ["<trait 1>", "<trait 2>"],
    "cognitive_strengths": ["<strength 1>", "<strength 2>"],
    "subject_strengths": {{
        "mathematics": <score_out_of_10>,
        "science": <score_out_of_10>,
        "language": <score_out_of_10>
    }},
    "weak_areas": ["<topic 1>", "<topic 2>"],
    "recommended_approach": "<detailed_approach>",
    "motivation_factors": ["<factor 1>", "<factor 2>"]
}}
"""
        
        try:
            result = self.personalization_agent.start(prompt)
            import json
            response_text = result.raw if hasattr(result, 'raw') else str(result)
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text
            
            profile = json.loads(json_str)
            profile["student_id"] = student_id
            profile["analysis_date"] = datetime.now().isoformat()
            
            # Store profile in memory (Supabase)
            self.memory.add(
                messages=[{"role": "system", "content": json.dumps(profile)}],
                user_id=student_id,
                metadata={"type": "student_profile"}
            )
            
            return profile
            
        except Exception as e:
            logger.error(f"Error analyzing student profile: {e}")
            return {
                "error": str(e),
                "student_id": student_id
            }
    
    def generate_personalized_assignments(
        self,
        student_id: str,
        subject: str,
        topic: str,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized assignments based on student profile.
        
        Args:
            student_id: Student identifier
            subject: Subject (math, science, language)
            topic: Specific topic
            num_questions: Number of questions to generate
            difficulty: Difficulty level (easy, medium, hard)
        
        Returns:
            List of personalized questions
        """
        # Retrieve student profile from memory
        profile = self._get_student_profile(student_id)
        
        if not profile:
            logger.warning(f"No profile found for student {student_id}, using default")
            profile = {"learning_style": {"primary": "visual"}}
        
        # Search knowledge base for relevant questions
        query = f"{subject} {topic} {difficulty}"
        relevant_questions = self.knowledge.search(query=query, limit=num_questions * 2)
        
        # Personalize questions based on learning style
        prompt = f"""Generate {num_questions} personalized questions for this student:

**Student Profile:**
- Learning Style: {profile.get('learning_style', {}).get('primary', 'visual')}
- Cognitive Strengths: {profile.get('cognitive_strengths', [])}
- Weak Areas: {profile.get('weak_areas', [])}

**Assignment Requirements:**
- Subject: {subject}
- Topic: {topic}
- Difficulty: {difficulty}
- Number of Questions: {num_questions}

**Available Questions from Knowledge Base:**
{self._format_questions(relevant_questions)}

**Instructions:**
1. Adapt questions to student's learning style (e.g., add diagrams for visual learners)
2. Include mix of topics focusing on weak areas
3. Provide appropriate difficulty level
4. Add remedial questions if student has struggled with this topic before

Generate questions in JSON format:
[
    {{
        "question_id": "<unique_id>",
        "question_text": "<question>",
        "difficulty": "<level>",
        "learning_style_adaptation": "<how_it's_adapted>",
        "marks": <points>,
        "hints": ["<hint 1>", "<hint 2>"]
    }}
]
"""
        
        try:
            result = self.personalization_agent.start(prompt)
            import json
            response_text = result.raw if hasattr(result, 'raw') else str(result)
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text
            
            questions = json.loads(json_str)
            return questions
            
        except Exception as e:
            logger.error(f"Error generating personalized assignments: {e}")
            return []
    
    def _summarize_performance(self, past_performance: List[Dict[str, Any]]) -> str:
        """Helper to summarize past performance."""
        if not past_performance:
            return "No past performance data available"
        
        summary = []
        for perf in past_performance[-10:]:  # Last 10 assignments
            summary.append(
                f"- {perf.get('subject', 'Unknown')}/{perf.get('topic', 'Unknown')}: "
                f"{perf.get('marks_obtained', 0)}/{perf.get('max_marks', 10)} "
                f"({perf.get('date', 'N/A')})"
            )
        
        return "\n".join(summary)
    
    def _get_student_profile(self, student_id: str) -> Optional[Dict]:
        """Retrieve student profile from memory."""
        try:
            # Search memory for student profile
            results = self.memory.search(
                query=f"student_profile {student_id}",
                user_id=student_id,
                limit=1
            )
            if results and len(results) > 0:
                import json
                return json.loads(results[0].get('content', '{}'))
            return None
        except Exception as e:
            logger.error(f"Error retrieving student profile: {e}")
            return None
    
    def _format_questions(self, questions: List[Dict]) -> str:
        """Helper to format questions for prompt."""
        if not questions:
            return "No questions found in knowledge base"
        
        formatted = []
        for i, q in enumerate(questions[:10], 1):
            formatted.append(f"{i}. {q.get('content', 'N/A')}")
        
        return "\n".join(formatted)


# Example usage
if __name__ == "__main__":
    # Set up environment
    os.environ["OPENAI_API_KEY"] = os.getenv("GROQ_API_KEY")
    os.environ["OPENAI_BASE_URL"] = "https://api.groq.com/openai/v1"
    
    # Initialize service
    personalizer = PersonalizationService()
    
    # Example: Analyze student
    past_performance = [
        {"subject": "mathematics", "topic": "algebra", "marks_obtained": 7, "max_marks": 10, "date": "2025-01-15"},
        {"subject": "mathematics", "topic": "geometry", "marks_obtained": 4, "max_marks": 10, "date": "2025-01-20"},
        {"subject": "science", "topic": "physics", "marks_obtained": 8, "max_marks": 10, "date": "2025-01-22"},
    ]
    
    profile = personalizer.analyze_student_profile(
        student_id="STUDENT_001",
        past_performance=past_performance
    )
    
    print("Student Profile:", profile)

