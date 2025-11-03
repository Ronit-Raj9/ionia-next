"""
EVENT Agent: Intelligent Event Scheduling & Alert System
AI-powered event creation, scheduling optimization, and notification enhancement
"""
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import os
import logging
from datetime import datetime, timedelta

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


class EVENTAgent:
    """
    EVENT Agent: Intelligent event scheduling and notification system
    - Optimizes event timing based on student performance patterns
    - Generates smart reminders
    - Suggests optimal assignment/test schedules
    - Personalizes notification messages
    """
    
    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "groq")
        self.model = os.getenv("EVENT_MODEL", "llama-3.1-70b-versatile")
        self.api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        
        if Agent:
            self._init_agent()
        else:
            logger.warning("PraisonAI not available, using fallback event scheduling")
    
    def _init_agent(self):
        """Initialize the EVENT agent"""
        try:
            self.event_agent = Agent(
                name="EVENT Scheduler",
                role="Intelligent Event & Alert Coordinator",
                goal="Optimize event scheduling and notification timing for maximum student engagement and learning outcomes",
                backstory="""You are an AI event coordinator with expertise in cognitive psychology, 
                learning patterns, and educational scheduling. You analyze student performance data, 
                learning patterns, and optimal study times to suggest the best times for events, 
                assignments, and notifications.""",
                llm=f"{self.llm_provider}/{self.model}",
                verbose=False
            )
            
            logger.info("EVENT agent initialized successfully")
        
        except Exception as e:
            logger.error(f"Error initializing EVENT agent: {str(e)}")
            self.event_agent = None
    
    async def optimize_schedule(
        self,
        event_type: str,
        scheduled_at: str,
        duration: int,
        target_audience: Dict[str, Any],
        assignment_id: Optional[str] = None,
        student_performance_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Optimize event scheduling using AI
        """
        try:
            if self.event_agent and Agent:
                return await self._ai_optimize_schedule(
                    event_type, scheduled_at, duration, target_audience, assignment_id, student_performance_data
                )
            else:
                return await self._fallback_optimize_schedule(
                    event_type, scheduled_at, duration, target_audience
                )
        
        except Exception as e:
            logger.error(f"Error in optimize_schedule: {str(e)}")
            return await self._fallback_optimize_schedule(
                event_type, scheduled_at, duration, target_audience
            )
    
    async def _ai_optimize_schedule(
        self,
        event_type: str,
        scheduled_at: str,
        duration: int,
        target_audience: Dict[str, Any],
        assignment_id: Optional[str],
        student_performance_data: Optional[List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """Use AI to optimize scheduling"""
        
        try:
            task = Task(
                name="Optimize Event Schedule",
                description=f"""Analyze and optimize this event schedule:

Event Type: {event_type}
Proposed Time: {scheduled_at}
Duration: {duration} minutes
Target Audience: {json.dumps(target_audience, indent=2)}

{f"Student Performance Data: {json.dumps(student_performance_data, indent=2)}" if student_performance_data else ""}

Based on educational research and student learning patterns:

1. **Optimal Timing Analysis**:
   - Is this the best time for maximum engagement?
   - Consider cognitive load, attention spans, and typical study times
   - For assignments/tests: When will students be most prepared?

2. **Preparation Time Assessment**:
   - How much time do students typically need to prepare?
   - Based on difficulty and student readiness

3. **Related Topics & Dependencies**:
   - What prerequisite knowledge is needed?
   - What topics should be reviewed beforehand?

4. **Smart Reminder Schedule**:
   - When should reminders be sent for optimal effect?
   - Consider: 1 week before, 3 days before, 1 day before, 2 hours before

5. **Student Readiness Scoring**:
   - If performance data available, estimate readiness (0-100) per student
   - Identify students who may need extra preparation time

Return as JSON:
{{
    "optimal_timing": {{
        "recommended_date": "YYYY-MM-DD HH:MM",
        "reasoning": "",
        "confidence_score": 0-100
    }},
    "expected_preparation_time": minutes,
    "related_topics": [""],
    "suggested_reminders": [
        {{"time": "YYYY-MM-DD HH:MM", "message": ""}}
    ],
    "difficulty": "easy|medium|hard",
    "student_readiness": {{
        "student_id": readiness_score
    }},
    "recommendations": [""],
    "risk_factors": [""]
}}
""",
                expected_output="JSON with scheduling optimization insights",
                agent=self.event_agent,
                async_execution=False
            )
            
            agents_system = PraisonAIAgents(
                agents=[self.event_agent],
                tasks=[task],
                process="sequential"
            )
            
            result = agents_system.start()
            insights = self._parse_json_response(result)
            
            return {
                "success": True,
                "insights": insights,
                "optimized_by": "event-agent"
            }
        
        except Exception as e:
            logger.error(f"Error in AI schedule optimization: {str(e)}")
            return await self._fallback_optimize_schedule(
                event_type, scheduled_at, duration, target_audience
            )
    
    async def _fallback_optimize_schedule(
        self,
        event_type: str,
        scheduled_at: str,
        duration: int,
        target_audience: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fallback schedule optimization using heuristics"""
        
        try:
            scheduled_date = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
            
            # Heuristic recommendations
            insights = {
                "optimal_timing": {
                    "recommended_date": scheduled_at,
                    "reasoning": "Proposed time is acceptable",
                    "confidence_score": 70
                },
                "expected_preparation_time": duration * 2,  # Double the event duration
                "related_topics": [],
                "suggested_reminders": [
                    {
                        "time": (scheduled_date - timedelta(days=7)).isoformat(),
                        "message": "1 week reminder: Prepare for upcoming event"
                    },
                    {
                        "time": (scheduled_date - timedelta(days=1)).isoformat(),
                        "message": "Tomorrow: Don't forget your upcoming event"
                    },
                    {
                        "time": (scheduled_date - timedelta(hours=2)).isoformat(),
                        "message": "In 2 hours: Your event is starting soon"
                    }
                ],
                "difficulty": "medium",
                "student_readiness": {},
                "recommendations": [
                    "Send preparation materials in advance",
                    "Ensure all students have access",
                    "Set up reminder notifications"
                ],
                "risk_factors": []
            }
            
            # Adjust based on event type
            if event_type in ['assignment_due', 'test_scheduled']:
                insights["expected_preparation_time"] = duration * 3
                insights["risk_factors"].append("Students may need study materials in advance")
            
            return {
                "success": True,
                "insights": insights,
                "optimized_by": "fallback-heuristics"
            }
        
        except Exception as e:
            logger.error(f"Error in fallback optimization: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def enhance_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Enhance notification with AI personalization
        """
        try:
            if self.event_agent and Agent:
                return await self._ai_enhance_notification(
                    user_id, title, message, notification_type, data
                )
            else:
                return await self._fallback_enhance_notification(
                    user_id, title, message, notification_type
                )
        
        except Exception as e:
            logger.error(f"Error in enhance_notification: {str(e)}")
            return await self._fallback_enhance_notification(
                user_id, title, message, notification_type
            )
    
    async def _ai_enhance_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Use AI to enhance notification"""
        
        try:
            task = Task(
                name="Enhance Notification",
                description=f"""Personalize and optimize this notification:

User ID: {user_id}
Type: {notification_type}
Title: {title}
Message: {message}
{f"Additional Context: {json.dumps(data, indent=2)}" if data else ""}

Enhance the notification by:

1. **Sentiment Analysis**: Determine if message should be:
   - Encouraging (for struggling students)
   - Congratulatory (for achievements)
   - Neutral (for information)
   - Urgent (for deadlines)

2. **Personalized Message**:
   - Rewrite the message to be more engaging and personalized
   - Use motivational language where appropriate
   - Be concise but informative

3. **Suggested Action**:
   - What's the best action for the student to take?
   - Be specific and actionable

4. **Optimal Delivery Time**:
   - When is the best time to send this notification?
   - Consider: student's typical active hours, urgency, type

5. **Urgency Score**:
   - Rate urgency from 0-100
   - 0-30: Low priority, can wait
   - 31-70: Normal priority
   - 71-100: High priority, send immediately

Return as JSON:
{{
    "sentiment": "positive|neutral|negative|encouraging",
    "personalized_message": "",
    "suggested_action": "",
    "optimal_delivery_time": "YYYY-MM-DD HH:MM" or null (send now),
    "urgency_score": 0-100
}}
""",
                expected_output="JSON with notification enhancement",
                agent=self.event_agent,
                async_execution=False
            )
            
            agents_system = PraisonAIAgents(
                agents=[self.event_agent],
                tasks=[task],
                process="sequential"
            )
            
            result = agents_system.start()
            insights = self._parse_json_response(result)
            
            return {
                "success": True,
                "insights": insights,
                "enhanced_by": "event-agent"
            }
        
        except Exception as e:
            logger.error(f"Error in AI notification enhancement: {str(e)}")
            return await self._fallback_enhance_notification(
                user_id, title, message, notification_type
            )
    
    async def _fallback_enhance_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str
    ) -> Dict[str, Any]:
        """Fallback notification enhancement"""
        
        # Simple heuristics based on type
        sentiment_map = {
            'assignment_created': 'neutral',
            'assignment_due_soon': 'urgent',
            'assignment_graded': 'neutral',
            'feedback_available': 'encouraging',
            'achievement_earned': 'positive',
            'streak_milestone': 'positive',
            'message_received': 'neutral',
        }
        
        urgency_map = {
            'assignment_due_soon': 85,
            'achievement_earned': 60,
            'assignment_created': 40,
            'feedback_available': 50,
        }
        
        insights = {
            "sentiment": sentiment_map.get(notification_type, 'neutral'),
            "personalized_message": message,  # Use original for fallback
            "suggested_action": "Check your dashboard for details",
            "optimal_delivery_time": None,  # Send immediately
            "urgency_score": urgency_map.get(notification_type, 50)
        }
        
        return {
            "success": True,
            "insights": insights,
            "enhanced_by": "fallback"
        }
    
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

