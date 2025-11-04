"""
ARC Agent: Adaptive Revision & Cognition
Personalization engine with memory and learning analytics
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
    Agent = None
    Task = None
    PraisonAIAgents = None

logger = logging.getLogger(__name__)


class ARCAgent:
    """
    Adaptive Revision & Cognition Agent:
    - Personalizes content based on OCEAN traits
    - Adjusts difficulty dynamically
    - Maintains student learning memory
    - Identifies optimal learning paths
    """
    
    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "groq")
        self.model = os.getenv("PERSONALIZATION_MODEL", "llama-3.1-70b-versatile")
        self.api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        
        if Agent:
            self._init_agent()
        else:
            logger.warning("PraisonAI not available, using fallback personalization")
    
    def _init_agent(self):
        """Initialize the ARC agent with memory"""
        try:
            self.arc_agent = Agent(
                name="ARC Personalization Engine",
                role="Adaptive Learning Specialist",
                goal="Personalize learning experiences based on individual student profiles and performance",
                backstory="""You are an AI learning specialist with deep understanding of 
                cognitive psychology, OCEAN personality traits, and adaptive learning. 
                You analyze student profiles and performance to create perfectly tailored 
                learning experiences.""",
                llm=f"{self.llm_provider}/{self.model}",
                verbose=False,
                # Enable memory for student context
                memory=True
            )
            
            logger.info("ARC agent initialized successfully with memory")
        
        except Exception as e:
            logger.error(f"Error initializing ARC agent: {str(e)}")
            self.arc_agent = None
    
    async def personalize_questions(
        self,
        student_profile: Dict[str, Any],
        questions: List[Dict[str, Any]],
        subject: str,
        difficulty_level: str = "medium"
    ) -> Dict[str, Any]:
        """
        Personalize questions based on student profile:
        - OCEAN traits influence presentation style
        - Learning preferences affect examples used
        - Difficulty matches ZPD (Zone of Proximal Development)
        """
        try:
            if self.arc_agent and Agent:
                return await self._multi_agent_personalization(
                    student_profile, questions, subject, difficulty_level
                )
            else:
                return await self._fallback_personalization(
                    student_profile, questions, subject, difficulty_level
                )
        
        except Exception as e:
            logger.error(f"Error in personalize_questions: {str(e)}")
            return await self._fallback_personalization(
                student_profile, questions, subject, difficulty_level
            )
    
    async def _multi_agent_personalization(
        self,
        student_profile: Dict[str, Any],
        questions: List[Dict[str, Any]],
        subject: str,
        difficulty_level: str
    ) -> Dict[str, Any]:
        """Use PraisonAI agent for personalization"""
        
        try:
            # Extract key profile data
            ocean = student_profile.get("ocean", {})
            preferences = student_profile.get("learningPreferences", {})
            mastery = student_profile.get("currentMastery", {})
            
            context = f"""
=== STUDENT PROFILE ===
OCEAN Traits:
- Openness: {ocean.get('openness', 50)}/100 {"(High - Enjoys novelty)" if ocean.get('openness', 50) > 60 else "(Moderate)"}
- Conscientiousness: {ocean.get('conscientiousness', 50)}/100 {"(High - Detail-oriented)" if ocean.get('conscientiousness', 50) > 60 else "(Moderate)"}
- Extraversion: {ocean.get('extraversion', 50)}/100 {"(High - Social examples)" if ocean.get('extraversion', 50) > 60 else "(Moderate)"}
- Agreeableness: {ocean.get('agreeableness', 50)}/100 {"(High - Cooperative)" if ocean.get('agreeableness', 50) > 60 else "(Moderate)"}
- Neuroticism: {ocean.get('neuroticism', 50)}/100 {"(High - Needs reassurance)" if ocean.get('neuroticism', 50) > 50 else "(Moderate)"}

Learning Preferences:
- Visual: {preferences.get('visual', 50)}/100
- Auditory: {preferences.get('auditory', 50)}/100
- Kinesthetic: {preferences.get('kinesthetic', 50)}/100
- Reading/Writing: {preferences.get('readingWriting', 50)}/100

Current Mastery (Subject: {subject}):
{json.dumps(mastery, indent=2)}

Difficulty Level: {difficulty_level}

=== QUESTIONS TO PERSONALIZE ===
{json.dumps(questions, indent=2)}

=== PERSONALIZATION INSTRUCTIONS ===
For each question, create a personalized variant that:

1. **OCEAN-Based Adaptations**:
   - High Openness → Add creative examples, multiple approaches
   - High Conscientiousness → Include detailed steps, structured format
   - High Extraversion → Use social contexts, group scenarios
   - High Agreeableness → Collaborative framing, helping scenarios
   - High Neuroticism → Reassuring language, clear guidance

2. **Learning Style Adaptations**:
   - Visual learners → Suggest diagrams, visual representations
   - Auditory → Include rhythm, patterns, verbal explanations
   - Kinesthetic → Hands-on examples, physical analogies
   - Reading/Writing → Text-rich, written explanations

3. **Difficulty Matching**:
   - Use mastery data to adjust complexity
   - Stay in ZPD (challenging but achievable)
   - Scaffold difficult concepts

Return JSON array with personalized variants:
{{
    "personalized_questions": [
        {{
            "original_question_id": "",
            "personalized_text": "",
            "personalization_strategy": "",
            "difficulty_adjusted": true/false,
            "rationale": ""
        }}
    ],
    "overall_strategy": "",
    "estimated_completion_time": ""
}}
"""

            task = Task(
                name="Personalize Questions",
                description=context,
                expected_output="JSON with personalized question variants",
                agent=self.arc_agent,
                async_execution=False
            )
            
            agents_system = PraisonAIAgents(
                agents=[self.arc_agent],
                tasks=[task],
                process="sequential"
            )
            
            result = agents_system.start()
            data = self._parse_json_response(result)
            
            return {
                "success": True,
                "personalized_questions": data.get("personalized_questions", []),
                "strategy": data.get("overall_strategy", ""),
                "estimated_time": data.get("estimated_completion_time", "30-45 minutes"),
                "personalization_factors": {
                    "ocean_traits": ocean,
                    "learning_style": self._get_dominant_learning_style(preferences),
                    "difficulty": difficulty_level
                }
            }
        
        except Exception as e:
            logger.error(f"Error in multi-agent personalization: {str(e)}")
            return await self._fallback_personalization(
                student_profile, questions, subject, difficulty_level
            )
    
    async def _fallback_personalization(
        self,
        student_profile: Dict[str, Any],
        questions: List[Dict[str, Any]],
        subject: str,
        difficulty_level: str
    ) -> Dict[str, Any]:
        """Fallback personalization using direct LLM"""
        
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
            
            ocean = student_profile.get("ocean", {})
            preferences = student_profile.get("learningPreferences", {})
            
            prompt = f"""Personalize these questions for a student with:
- OCEAN: O={ocean.get('openness', 50)}, C={ocean.get('conscientiousness', 50)}, E={ocean.get('extraversion', 50)}, A={ocean.get('agreeableness', 50)}, N={ocean.get('neuroticism', 50)}
- Learning Style: {self._get_dominant_learning_style(preferences)}
- Subject: {subject}
- Difficulty: {difficulty_level}

Questions:
{json.dumps(questions, indent=2)}

Return ONLY valid JSON:
{{
    "personalized_questions": [
        {{
            "original_question_id": "",
            "personalized_text": "",
            "personalization_strategy": "",
            "difficulty_adjusted": false,
            "rationale": ""
        }}
    ],
    "overall_strategy": ""
}}"""

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an adaptive learning specialist. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            data = self._parse_json_response(response.choices[0].message.content)
            
            return {
                "success": True,
                "personalized_questions": data.get("personalized_questions", questions),
                "strategy": data.get("overall_strategy", "Standard personalization applied"),
                "personalization_factors": {
                    "ocean_traits": ocean,
                    "learning_style": self._get_dominant_learning_style(preferences)
                }
            }
        
        except Exception as e:
            logger.error(f"Error in fallback personalization: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "personalized_questions": questions,  # Return original
                "strategy": "No personalization applied (error)"
            }
    
    async def adjust_difficulty(
        self,
        student_id: str,
        performance_history: List[Dict[str, Any]],
        current_difficulty: str
    ) -> Dict[str, Any]:
        """
        Dynamic difficulty adjustment based on performance
        """
        try:
            # Analyze recent performance
            recent_scores = [p.get("score", 0) for p in performance_history[-10:]]
            avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0
            
            # Calculate performance trend
            if len(recent_scores) >= 5:
                first_half = sum(recent_scores[:len(recent_scores)//2]) / (len(recent_scores)//2)
                second_half = sum(recent_scores[len(recent_scores)//2:]) / (len(recent_scores) - len(recent_scores)//2)
                trend = "improving" if second_half > first_half else "declining" if second_half < first_half else "stable"
            else:
                trend = "insufficient_data"
            
            # Determine optimal difficulty
            if avg_score > 85 and trend in ["improving", "stable"]:
                recommended_difficulty = "hard"
                reason = "Student consistently scoring high, ready for more challenge"
            elif avg_score > 70 and trend == "improving":
                recommended_difficulty = "medium-hard"
                reason = "Student showing improvement, gradually increase difficulty"
            elif avg_score >= 50 and avg_score <= 70:
                recommended_difficulty = "medium"
                reason = "Student in optimal learning zone (ZPD)"
            elif avg_score < 50 and trend == "declining":
                recommended_difficulty = "easy-medium"
                reason = "Student struggling, reduce difficulty to build confidence"
            else:
                recommended_difficulty = "easy"
                reason = "Student needs foundational reinforcement"
            
            return {
                "success": True,
                "student_id": student_id,
                "current_difficulty": current_difficulty,
                "recommended_difficulty": recommended_difficulty,
                "reason": reason,
                "performance_metrics": {
                    "average_score": avg_score,
                    "trend": trend,
                    "recent_scores": recent_scores[-5:],
                    "consistency": self._calculate_consistency(recent_scores)
                },
                "should_adjust": recommended_difficulty != current_difficulty
            }
        
        except Exception as e:
            logger.error(f"Error in adjust_difficulty: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "recommended_difficulty": current_difficulty
            }
    
    async def analyze_student(
        self,
        student_id: str,
        submission_history: List[Dict[str, Any]],
        current_mastery: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deep student analysis for adaptive learning
        """
        try:
            # Analyze patterns
            weak_topics = self._identify_weak_topics(submission_history, current_mastery)
            strong_topics = self._identify_strong_topics(current_mastery)
            learning_patterns = self._analyze_learning_patterns(submission_history)
            
            return {
                "success": True,
                "student_id": student_id,
                "weak_topics": weak_topics,
                "strong_topics": strong_topics,
                "learning_patterns": learning_patterns,
                "recommendations": {
                    "focus_areas": weak_topics[:3],
                    "practice_frequency": self._recommend_practice_frequency(learning_patterns),
                    "optimal_session_length": self._recommend_session_length(learning_patterns),
                    "next_steps": self._generate_next_steps(weak_topics, strong_topics)
                }
            }
        
        except Exception as e:
            logger.error(f"Error in analyze_student: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def analyze_from_grading(
        self,
        student_id: str,
        grading_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze student from recent grading result"""
        
        analysis = grading_result.get("analysis", {})
        
        return {
            "weak_areas": analysis.get("weak_topics", []),
            "conceptual_gaps": analysis.get("conceptual_gaps", []),
            "difficulty_match": analysis.get("difficulty_assessment", "appropriate"),
            "recommendations": analysis.get("remediation_suggestions", [])
        }
    
    async def generate_next_assignment(
        self,
        student_id: str,
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate next personalized assignment based on analysis"""
        
        return {
            "focus_topics": analysis.get("weak_areas", [])[:3],
            "difficulty": "medium" if analysis.get("difficulty_match") == "appropriate" else "easy",
            "question_count": 10,
            "personalization": "high",
            "remediation_mode": len(analysis.get("conceptual_gaps", [])) > 3
        }
    
    # Helper methods
    
    def _get_dominant_learning_style(self, preferences: Dict[str, int]) -> str:
        """Get dominant learning style"""
        if not preferences:
            return "balanced"
        
        max_pref = max(preferences.items(), key=lambda x: x[1])
        return max_pref[0] if max_pref[1] > 60 else "balanced"
    
    def _calculate_consistency(self, scores: List[float]) -> float:
        """Calculate score consistency (0-100)"""
        if len(scores) < 2:
            return 100.0
        
        import statistics
        mean = statistics.mean(scores)
        if mean == 0:
            return 0.0
        
        std_dev = statistics.stdev(scores)
        cv = (std_dev / mean) * 100  # Coefficient of variation
        
        # Convert to consistency score (lower CV = higher consistency)
        consistency = max(0, 100 - cv)
        return round(consistency, 2)
    
    def _identify_weak_topics(
        self,
        submission_history: List[Dict[str, Any]],
        current_mastery: Dict[str, Any]
    ) -> List[str]:
        """Identify topics where student is weak"""
        weak_topics = []
        
        for topic, mastery in current_mastery.items():
            if mastery < 50:
                weak_topics.append(topic)
        
        return sorted(weak_topics, key=lambda t: current_mastery.get(t, 0))
    
    def _identify_strong_topics(self, current_mastery: Dict[str, Any]) -> List[str]:
        """Identify topics where student is strong"""
        return [topic for topic, mastery in current_mastery.items() if mastery >= 75]
    
    def _analyze_learning_patterns(self, submission_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze learning patterns from submission history"""
        
        if not submission_history:
            return {"pattern": "insufficient_data"}
        
        # Analyze submission timing
        submission_times = [s.get("timestamp") for s in submission_history if s.get("timestamp")]
        
        # Analyze attempt patterns
        first_attempt_success = sum(1 for s in submission_history if s.get("score", 0) > 70 and s.get("attempt_number", 1) == 1)
        total_submissions = len(submission_history)
        
        return {
            "first_attempt_success_rate": (first_attempt_success / total_submissions * 100) if total_submissions > 0 else 0,
            "total_submissions": total_submissions,
            "pattern": "quick_learner" if first_attempt_success / total_submissions > 0.7 else "needs_practice"
        }
    
    def _recommend_practice_frequency(self, learning_patterns: Dict[str, Any]) -> str:
        """Recommend practice frequency"""
        pattern = learning_patterns.get("pattern", "needs_practice")
        
        if pattern == "quick_learner":
            return "3-4 times per week"
        else:
            return "daily practice recommended"
    
    def _recommend_session_length(self, learning_patterns: Dict[str, Any]) -> str:
        """Recommend optimal session length"""
        return "25-30 minutes" 
    
    def _generate_next_steps(self, weak_topics: List[str], strong_topics: List[str]) -> List[str]:
        """Generate next steps for student"""
        steps = []
        
        if weak_topics:
            steps.append(f"Focus on mastering: {', '.join(weak_topics[:3])}")
            steps.append("Complete remedial assignments for weak areas")
        
        if strong_topics:
            steps.append(f"Advance to complex problems in: {', '.join(strong_topics[:2])}")
        
        steps.append("Take a comprehensive practice test")
        
        return steps
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from LLM response"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            
            logger.error(f"Could not parse JSON from response: {response[:200]}")
            return {}

