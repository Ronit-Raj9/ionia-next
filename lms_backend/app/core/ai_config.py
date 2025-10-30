"""
AI Stack Configuration
LiteLLM, Qdrant, Google Vision, Sentence Transformers setup
"""
from typing import Optional, Dict, Any
from pathlib import Path
import os

from litellm import completion
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from sentence_transformers import SentenceTransformer
from google.cloud import vision

from app.core.config import settings
from app.core.logger import logger


# ============================================================================
# LITELLM CONFIGURATION
# ============================================================================

class LiteLLMConfig:
    """LiteLLM unified LLM interface configuration"""
    
    def __init__(self):
        self.model = settings.LITELLM_MODEL
        self.fallback_model = settings.LITELLM_FALLBACK_MODEL
        
        # Set API keys from environment
        if settings.GOOGLE_API_KEY:
            os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
        if settings.OPENAI_API_KEY:
            os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        if settings.ANTHROPIC_API_KEY:
            os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY
        if settings.GROQ_API_KEY:
            os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
        if settings.DEEPSEEK_API_KEY:
            os.environ["DEEPSEEK_API_KEY"] = settings.DEEPSEEK_API_KEY
    
    async def complete(
        self,
        messages: list,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Unified LLM completion with automatic failover.
        
        Args:
            messages: List of message dicts [{"role": "user", "content": "..."}]
            model: Override default model
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional LiteLLM parameters
        
        Returns:
            Response dict with 'content' and metadata
        """
        try:
            response = completion(
                model=model or self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                fallbacks=[self.fallback_model],
                **kwargs
            )
            
            content = response.choices[0].message.content
            
            logger.info(
                f"LiteLLM completion successful",
                model=response.model,
                tokens=response.usage.total_tokens
            )
            
            return {
                "content": content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            logger.error(f"LiteLLM completion failed: {e}")
            raise


litellm_client = LiteLLMConfig()


# ============================================================================
# QDRANT VECTOR DATABASE
# ============================================================================

class QdrantConfig:
    """Qdrant vector database configuration"""
    
    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            timeout=30
        )
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        
        # Initialize collection if it doesn't exist
        self._init_collection()
    
    def _init_collection(self):
        """Create Qdrant collection if it doesn't exist"""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.warning(f"Qdrant collection init: {e}")
    
    async def upsert(self, points: list):
        """Insert or update vectors"""
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Upserted {len(points)} points to Qdrant")
        except Exception as e:
            logger.error(f"Qdrant upsert failed: {e}")
            raise
    
    async def search(self, query_vector: list, limit: int = 5):
        """Semantic search"""
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit
            )
            logger.info(f"Qdrant search returned {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Qdrant search failed: {e}")
            raise


qdrant_client = QdrantConfig()


# ============================================================================
# SENTENCE TRANSFORMERS (Embeddings)
# ============================================================================

class EmbeddingConfig:
    """Sentence Transformers embedding model"""
    
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.model = SentenceTransformer(self.model_name)
        logger.info(f"Loaded embedding model: {self.model_name}")
    
    def encode(self, text: str | list[str]) -> list:
        """
        Generate embeddings for text.
        
        Args:
            text: Single string or list of strings
        
        Returns:
            Embedding vector(s)
        """
        try:
            embeddings = self.model.encode(text, convert_to_numpy=True)
            return embeddings.tolist() if hasattr(embeddings, 'tolist') else embeddings
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise


embedding_model = EmbeddingConfig()


# ============================================================================
# GOOGLE CLOUD VISION (OCR)
# ============================================================================

class OCRConfig:
    """Google Cloud Vision OCR configuration"""
    
    def __init__(self):
        if settings.GOOGLE_APPLICATION_CREDENTIALS:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS
        
        try:
            self.client = vision.ImageAnnotatorClient()
            logger.info("Google Cloud Vision client initialized")
        except Exception as e:
            logger.warning(f"Google Cloud Vision not available: {e}")
            self.client = None
    
    async def extract_text(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from image using OCR.
        
        Args:
            image_bytes: Image file bytes
        
        Returns:
            Dict with 'text' and 'confidence'
        """
        if not self.client:
            raise RuntimeError("Google Cloud Vision client not initialized")
        
        try:
            image = vision.Image(content=image_bytes)
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(response.error.message)
            
            text = response.full_text_annotation.text
            confidence = response.full_text_annotation.pages[0].confidence if response.full_text_annotation.pages else 0.0
            
            logger.info(f"OCR extracted {len(text)} characters with confidence {confidence:.2f}")
            
            return {
                "text": text,
                "confidence": confidence,
                "language": response.full_text_annotation.pages[0].property.detected_languages[0].language_code if response.full_text_annotation.pages else "unknown"
            }
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            raise


ocr_client = OCRConfig()


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    "litellm_client",
    "qdrant_client",
    "embedding_model",
    "ocr_client"
]

