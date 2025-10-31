# PraisonAI Agents tools availability check
PRAISONAI_AVAILABLE = False

try:
    from praisonaiagents import Agent, Task, PraisonAIAgents
    PRAISONAI_AVAILABLE = True
except ImportError:
    pass

# Export availability status
__all__ = ['PRAISONAI_AVAILABLE']
