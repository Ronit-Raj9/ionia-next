"""
LENS Agent: Lesson Enhancement & Navigation System
AI-powered lesson planning, syllabus analysis, and question generation
"""
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import os
import logging
import re

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


class LENSAgent:
    """
    LENS: Lesson Enhancement & Navigation System
    - Parses syllabus documents
    - Generates comprehensive lesson plans
    - Creates balanced question papers
    - Maps curriculum to learning objectives
    """
    
    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "groq")
        self.model = os.getenv("LESSON_PLANNING_MODEL", "llama-3.1-70b-versatile")
        self.api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        
        if Agent:
            self._init_agent()
        else:
            logger.warning("PraisonAI not available, using fallback lesson planning")
    
    def _init_agent(self):
        """Initialize the LENS agent"""
        try:
            self.lens_agent = Agent(
                name="LENS Planner",
                role="Curriculum Design & Lesson Planning Specialist",
                goal="Create comprehensive, balanced lesson plans aligned with curriculum standards",
                backstory="""You are an expert curriculum designer with deep knowledge of 
                pedagogical principles, learning objectives, and educational standards. 
                You create lesson plans that balance topic coverage, difficulty progression, 
                and student engagement.""",
                llm=f"{self.llm_provider}/{self.model}",
                verbose=False
            )
            
            logger.info("LENS agent initialized successfully")
        
        except Exception as e:
            logger.error(f"Error initializing LENS agent: {str(e)}")
            self.lens_agent = None
    
    async def generate_lesson_plan(
        self,
        syllabus_text: str,
        subject: str,
        grade: str,
        term: str = "Full Year"
    ) -> Dict[str, Any]:
        """
        Generate comprehensive lesson plan from syllabus
        """
        try:
            if self.lens_agent and Agent:
                return await self._multi_agent_lesson_planning(
                    syllabus_text, subject, grade, term
                )
            else:
                return await self._fallback_lesson_planning(
                    syllabus_text, subject, grade, term
                )
        
        except Exception as e:
            logger.error(f"Error in generate_lesson_plan: {str(e)}")
            return await self._fallback_lesson_planning(
                syllabus_text, subject, grade, term
            )
    
    async def _multi_agent_lesson_planning(
        self,
        syllabus_text: str,
        subject: str,
        grade: str,
        term: str
    ) -> Dict[str, Any]:
        """Use PraisonAI agent for lesson planning"""
        
        try:
            task = Task(
                name="Generate Lesson Plan",
                description=f"""Create a comprehensive lesson plan from this syllabus:

=== SYLLABUS ===
{syllabus_text}

=== REQUIREMENTS ===
Subject: {subject}
Grade: {grade}
Term: {term}

Generate a structured lesson plan with:

1. **Topic Breakdown**:
   - Extract all main topics and subtopics
   - Estimate teaching hours for each
   - Identify dependencies between topics

2. **Learning Objectives**:
   - Define clear, measurable objectives for each topic
   - Align with Bloom's Taxonomy levels

3. **Timeline**:
   - Create week-by-week schedule
   - Balance difficulty progression
   - Include buffer time for revision

4. **Assessment Strategy**:
   - Suggest formative assessments
   - Plan summative assessments
   - Define question distribution by topic

5. **Resource Recommendations**:
   - Teaching materials needed
   - Practice resources
   - Real-world applications

Return as JSON:
{{
    "topics": [
        {{
            "topic_name": "",
            "subtopics": [""],
            "learning_objectives": [""],
            "estimated_hours": 0,
            "difficulty_level": "easy|medium|hard",
            "prerequisites": [""],
            "week_number": 0
        }}
    ],
    "timeline": [
        {{
            "week": 0,
            "topics": [""],
            "objectives": [""],
            "assessments": [""]
        }}
    ],
    "assessment_plan": {{
        "formative": [""],
        "summative": [""],
        "question_distribution": {{}}
    }},
    "resources": {{
        "required": [""],
        "recommended": [""]
    }},
    "total_weeks": 0,
    "revision_weeks": 0
}}
""",
                expected_output="JSON with comprehensive lesson plan",
                agent=self.lens_agent,
                async_execution=False
            )
            
            agents_system = PraisonAIAgents(
                agents=[self.lens_agent],
                tasks=[task],
                process="sequential"
            )
            
            result = agents_system.start()
            data = self._parse_json_response(result)
            
            return {
                "success": True,
                "subject": subject,
                "grade": grade,
                "term": term,
                "lesson_plan": data,
                "generated_by": "lens-agent"
            }
        
        except Exception as e:
            logger.error(f"Error in multi-agent lesson planning: {str(e)}")
            return await self._fallback_lesson_planning(
                syllabus_text, subject, grade, term
            )
    
    async def _fallback_lesson_planning(
        self,
        syllabus_text: str,
        subject: str,
        grade: str,
        term: str
    ) -> Dict[str, Any]:
        """Fallback lesson planning using direct LLM"""
        
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
            
            prompt = f"""Create a detailed lesson plan from this syllabus:

Syllabus: {syllabus_text}
Subject: {subject}, Grade: {grade}, Term: {term}

Return ONLY valid JSON with structure:
{{
    "topics": [
        {{
            "topic_name": "",
            "subtopics": [],
            "learning_objectives": [],
            "estimated_hours": 0,
            "difficulty_level": "medium",
            "week_number": 0
        }}
    ],
    "timeline": [
        {{
            "week": 0,
            "topics": [],
            "objectives": [],
            "assessments": []
        }}
    ],
    "assessment_plan": {{
        "formative": [],
        "summative": []
    }},
    "total_weeks": 0
}}"""

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert curriculum designer. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=2500
            )
            
            data = self._parse_json_response(response.choices[0].message.content)
            
            return {
                "success": True,
                "subject": subject,
                "grade": grade,
                "term": term,
                "lesson_plan": data,
                "generated_by": "fallback-llm"
            }
        
        except Exception as e:
            logger.error(f"Error in fallback lesson planning: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "lesson_plan": {
                    "topics": [],
                    "timeline": [],
                    "total_weeks": 0
                }
            }
    
    async def parse_syllabus(
        self,
        file_content: bytes,
        filename: str
    ) -> Dict[str, Any]:
        """
        Parse syllabus from PDF/DOCX file
        """
        try:
            # Determine file type
            file_ext = Path(filename).suffix.lower()
            
            if file_ext == '.pdf':
                text = await self._extract_text_from_pdf(file_content)
            elif file_ext in ['.docx', '.doc']:
                text = await self._extract_text_from_docx(file_content)
            elif file_ext == '.txt':
                text = file_content.decode('utf-8')
            else:
                return {
                    "success": False,
                    "error": f"Unsupported file type: {file_ext}"
                }
            
            # Extract topics using LLM
            topics = await self._extract_topics_from_text(text)
            
            return {
                "success": True,
                "extracted_text": text,
                "topics": topics,
                "filename": filename
            }
        
        except Exception as e:
            logger.error(f"Error parsing syllabus: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _extract_text_from_pdf(self, content: bytes) -> str:
        """Extract text from PDF"""
        try:
            import PyPDF2
            import io
            
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text
        
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            return f"[Error extracting PDF: {str(e)}]"
    
    async def _extract_text_from_docx(self, content: bytes) -> str:
        """Extract text from DOCX"""
        try:
            import docx
            import io
            
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            
            return text
        
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {str(e)}")
            return f"[Error extracting DOCX: {str(e)}]"
    
    async def _extract_topics_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract structured topics from syllabus text"""
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
            
            prompt = f"""Extract all topics and subtopics from this syllabus text:

{text[:3000]}  # Limit to first 3000 chars

Return ONLY valid JSON array:
[
    {{
        "topic": "",
        "subtopics": [],
        "estimated_difficulty": "easy|medium|hard"
    }}
]"""

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a curriculum analyst. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            topics = self._parse_json_response(response.choices[0].message.content)
            
            if isinstance(topics, list):
                return topics
            elif isinstance(topics, dict) and 'topics' in topics:
                return topics['topics']
            else:
                return []
        
        except Exception as e:
            logger.error(f"Error extracting topics: {str(e)}")
            return []
    
    async def generate_questions(
        self,
        topic: str,
        subject: str,
        difficulty: str,
        count: int = 10,
        question_types: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate questions for specific topic
        """
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
            
            if question_types is None:
                question_types = ["mcq", "short_answer", "long_answer"]
            
            prompt = f"""Generate {count} high-quality questions for:

Topic: {topic}
Subject: {subject}
Difficulty: {difficulty}
Question Types: {', '.join(question_types)}

Requirements:
1. Balanced distribution of question types
2. Clear, unambiguous wording
3. Appropriate difficulty level
4. Include correct answers and explanations

Return ONLY valid JSON:
{{
    "questions": [
        {{
            "type": "mcq|short_answer|long_answer",
            "text": "",
            "options": ["A", "B", "C", "D"],  # Only for MCQ
            "correct_answer": "",
            "explanation": "",
            "marks": 0,
            "difficulty": "{difficulty}",
            "bloom_level": "remember|understand|apply|analyze|evaluate|create"
        }}
    ]
}}"""

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert question paper designer. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2500
            )
            
            data = self._parse_json_response(response.choices[0].message.content)
            
            return {
                "success": True,
                "topic": topic,
                "subject": subject,
                "difficulty": difficulty,
                "questions": data.get("questions", []),
                "generated_count": len(data.get("questions", []))
            }
        
        except Exception as e:
            logger.error(f"Error generating questions: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "questions": []
            }
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from LLM response"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            json_match = re.search(r'```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Try to find any JSON object or array
            json_match = re.search(r'(\{.*\}|\[.*\])', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            logger.error(f"Could not parse JSON from response: {response[:200]}")
            return {}

