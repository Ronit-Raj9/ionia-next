import os
import json
import time
import shutil
from typing import Any, Dict, List, Optional, Union, Literal
import logging
from datetime import datetime

# Disable litellm telemetry before any imports
os.environ["LITELLM_TELEMETRY"] = "False"

# Set up logger with custom TRACE level
logger = logging.getLogger(__name__)

# Add custom TRACE level (below DEBUG)
TRACE_LEVEL = 5
logging.addLevelName(TRACE_LEVEL, 'TRACE')

def trace(self, message, *args, **kwargs):
    if self.isEnabledFor(TRACE_LEVEL):
        self._log(TRACE_LEVEL, message, args, **kwargs)

logging.Logger.trace = trace

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False
    pass

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    pass

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import litellm
    litellm.telemetry = False  # Disable telemetry
    LITELLM_AVAILABLE = True
except ImportError:
    LITELLM_AVAILABLE = False

try:
    import pymongo
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False




class Memory:
    """
    A single-file memory manager covering:
    - Short-term memory (STM) for ephemeral context
    - Long-term memory (LTM) for persistent knowledge
    - Entity memory (structured data about named entities)
    - User memory (preferences/history for each user)
    - Quality score logic for deciding which data to store in LTM
    - Context building from multiple memory sources

    Config example:
    {
      "provider": "qdrant" or "mongodb" or "supabase" or "none",
      "use_embedding": True,
      "supabase_url": "https://xxx.supabase.co",
      "supabase_key": "xxx",
      "qdrant_url": "http://localhost:6333",
      "qdrant_api_key": None,  # optional for cloud
      "config": {
        # Supabase configuration
        "supabase_url": "https://xxx.supabase.co",
        "supabase_key": "xxx",
        
        # MongoDB configuration (if provider is "mongodb")
        "connection_string": "mongodb://localhost:27017/" or "mongodb+srv://user:pass@cluster.mongodb.net/",
        "database": "praisonai",
        "use_vector_search": True,  # Enable Atlas Vector Search
        "max_pool_size": 50,
        "min_pool_size": 10,
        "max_idle_time": 30000,
        "server_selection_timeout": 5000,
        
        # Qdrant configuration (for RAG/vector search)
        "qdrant_url": "http://localhost:6333",  # or cloud URL
        "qdrant_api_key": None,  # optional for cloud
        "qdrant_collection": "memory_store",
        
        "llm": {
          "provider": "openai",
          "config": {"model": "gpt-5-nano", "api_key": "..."}
        },
        "embedder": {
          "provider": "openai",
          "config": {"model": "text-embedding-3-small", "api_key": "..."}
        }
      }
    }
    
    Note: This version uses Supabase for persistent storage and Qdrant for vector search.
    """

    def __init__(self, config: Dict[str, Any], verbose: int = 0):
        self.cfg = config or {}
        self.verbose = verbose
        
        # Set logger level based on verbose
        if verbose >= 5:
            logger.setLevel(logging.INFO)
        else:
            logger.setLevel(logging.WARNING)
            
        # Set loggers to WARNING
        logging.getLogger('qdrant_client').setLevel(logging.WARNING)
        logging.getLogger('openai').setLevel(logging.WARNING)
        logging.getLogger('httpx').setLevel(logging.WARNING)
        logging.getLogger('httpcore').setLevel(logging.WARNING)
        logging.getLogger('utils').setLevel(logging.WARNING)
        logging.getLogger('litellm.utils').setLevel(logging.WARNING)
            
        self.provider = self.cfg.get("provider", "qdrant")
        self.use_qdrant = (self.provider.lower() == "qdrant") and QDRANT_AVAILABLE and self.cfg.get("use_embedding", False)
        self.use_supabase = SUPABASE_AVAILABLE
        self.use_mongodb = (self.provider.lower() == "mongodb") and PYMONGO_AVAILABLE
        
        # Extract embedding model from config
        self.embedder_config = self.cfg.get("embedder", {})
        if isinstance(self.embedder_config, dict):
            embedder_model_config = self.embedder_config.get("config", {})
            self.embedding_model = embedder_model_config.get("model", "text-embedding-3-small")
        else:
            self.embedding_model = "text-embedding-3-small"
        
        self._log_verbose(f"Using embedding model: {self.embedding_model}")

        # Determine embedding dimensions based on model
        self.embedding_dimensions = self._get_embedding_dimensions(self.embedding_model)
        self._log_verbose(f"Using embedding dimensions: {self.embedding_dimensions}")

        # Initialize Supabase for persistent storage
        if self.use_supabase:
            self._init_supabase()

        # Conditionally init Qdrant or MongoDB
        if self.use_qdrant:
            self._init_qdrant()
        elif self.use_mongodb:
            self._init_mongodb()

    def _log_verbose(self, msg: str, level: int = logging.INFO):
        """Only log if verbose >= 5"""
        if self.verbose >= 5:
            logger.log(level, msg)

    # -------------------------------------------------------------------------
    #                          Initialization
    # -------------------------------------------------------------------------
    def _init_supabase(self):
        """Initialize Supabase client for persistent memory storage."""
        try:
            supabase_url = self.cfg.get("supabase_url") or self.cfg.get("config", {}).get("supabase_url") or os.getenv("SUPABASE_URL")
            supabase_key = self.cfg.get("supabase_key") or self.cfg.get("config", {}).get("supabase_key") or os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                self._log_verbose("Supabase credentials not provided, skipping Supabase initialization", logging.WARNING)
                self.use_supabase = False
                return
            
            self.supabase: Client = create_client(supabase_url, supabase_key)
            
            # Test connection by attempting to access the database
            try:
                # Create tables if they don't exist (using RPC or REST)
                self._log_verbose("Supabase client initialized successfully")
            except Exception as e:
                self._log_verbose(f"Supabase connection test failed: {e}", logging.WARNING)
                self.use_supabase = False
                
        except Exception as e:
            self._log_verbose(f"Failed to initialize Supabase: {e}", logging.ERROR)
            self.use_supabase = False

    def _init_qdrant(self):
        """Initialize Qdrant client for embedding-based search."""
        try:
            qdrant_url = self.cfg.get("qdrant_url") or self.cfg.get("config", {}).get("qdrant_url", "http://localhost:6333")
            qdrant_api_key = self.cfg.get("qdrant_api_key") or self.cfg.get("config", {}).get("qdrant_api_key")
            qdrant_path = self.cfg.get("qdrant_path") or self.cfg.get("config", {}).get("qdrant_path")
            
            # Initialize Qdrant client
            if qdrant_path:
                # Local persistent storage
                os.makedirs(qdrant_path, exist_ok=True)
                self.qdrant_client = QdrantClient(path=qdrant_path)
            elif qdrant_api_key:
                # Cloud connection
                self.qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
            else:
                # Local server connection
                self.qdrant_client = QdrantClient(url=qdrant_url)

            # Get or create collection
            collection_name = self.cfg.get("qdrant_collection") or self.cfg.get("config", {}).get("qdrant_collection", "memory_store")
            self.qdrant_collection = collection_name
            
            try:
                self.qdrant_client.get_collection(collection_name)
                self._log_verbose(f"Using existing Qdrant collection: {collection_name}")
            except Exception:
                self._log_verbose(f"Creating new Qdrant collection: {collection_name}")
                self.qdrant_client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimensions,
                        distance=Distance.COSINE
                    )
                )
                self._log_verbose("Created new Qdrant collection")

        except Exception as e:
            self._log_verbose(f"Failed to initialize Qdrant: {e}", logging.ERROR)
            self.use_qdrant = False

    def _init_mongodb(self):
        """Initialize MongoDB client for memory storage."""
        try:
            mongo_cfg = self.cfg.get("config", {})
            self.connection_string = mongo_cfg.get("connection_string", "mongodb://localhost:27017/")
            self.database_name = mongo_cfg.get("database", "praisonai")
            self.use_vector_search = mongo_cfg.get("use_vector_search", False)
            
            # Initialize MongoDB client
            self.mongo_client = MongoClient(
                self.connection_string,
                maxPoolSize=mongo_cfg.get("max_pool_size", 50),
                minPoolSize=mongo_cfg.get("min_pool_size", 10),
                maxIdleTimeMS=mongo_cfg.get("max_idle_time", 30000),
                serverSelectionTimeoutMS=mongo_cfg.get("server_selection_timeout", 5000),
                retryWrites=True,
                retryReads=True
            )
            
            # Test connection
            self.mongo_client.admin.command('ping')
            
            # Setup database and collections
            self.mongo_db = self.mongo_client[self.database_name]
            self.mongo_short_term = self.mongo_db.short_term_memory
            self.mongo_long_term = self.mongo_db.long_term_memory
            self.mongo_entities = self.mongo_db.entity_memory
            self.mongo_users = self.mongo_db.user_memory
            
            # Create indexes for better performance
            self._create_mongodb_indexes()
            
            self._log_verbose("MongoDB initialized successfully")
            
        except Exception as e:
            self._log_verbose(f"Failed to initialize MongoDB: {e}", logging.ERROR)
            self.use_mongodb = False

    def _create_mongodb_indexes(self):
        """Create MongoDB indexes for better performance."""
        try:
            # Text search indexes
            self.mongo_short_term.create_index([("content", "text")])
            self.mongo_long_term.create_index([("content", "text")])
            
            # Compound indexes for filtering
            self.mongo_short_term.create_index([("created_at", -1), ("metadata.quality", -1)])
            self.mongo_long_term.create_index([("created_at", -1), ("metadata.quality", -1)])
            
            # User-specific indexes
            self.mongo_users.create_index([("user_id", 1), ("created_at", -1)])
            
            # Entity indexes
            self.mongo_entities.create_index([("entity_name", 1), ("entity_type", 1)])
            
            # Vector search indexes for Atlas (if enabled)
            if self.use_vector_search:
                self._create_vector_search_indexes()
                
        except Exception as e:
            self._log_verbose(f"Warning: Could not create MongoDB indexes: {e}", logging.WARNING)

    def _create_vector_search_indexes(self):
        """Create vector search indexes for Atlas."""
        try:
            vector_index_def = {
                "mappings": {
                    "dynamic": True,
                    "fields": {
                        "embedding": {
                            "type": "knnVector",
                            "dimensions": self.embedding_dimensions,
                            "similarity": "cosine"
                        }
                    }
                }
            }
            
            # Create vector indexes for both short and long term collections
            try:
                # Use SearchIndexModel for PyMongo 4.6+ compatibility
                try:
                    from pymongo.operations import SearchIndexModel
                    search_index_model = SearchIndexModel(definition=vector_index_def, name="vector_index")
                    self.mongo_short_term.create_search_index(search_index_model)
                    self.mongo_long_term.create_search_index(search_index_model)
                except ImportError:
                    # Fallback for older PyMongo versions
                    self.mongo_short_term.create_search_index(vector_index_def, "vector_index")
                    self.mongo_long_term.create_search_index(vector_index_def, "vector_index")
                self._log_verbose("Vector search indexes created successfully")
            except Exception as e:
                self._log_verbose(f"Could not create vector search indexes: {e}", logging.WARNING)
                
        except Exception as e:
            self._log_verbose(f"Error creating vector search indexes: {e}", logging.WARNING)

    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using available embedding services."""
        try:
            if LITELLM_AVAILABLE:
                # Use LiteLLM for consistency with the rest of the codebase
                import litellm
                
                response = litellm.embedding(
                    model=self.embedding_model,
                    input=text
                )
                return response.data[0]["embedding"]
            elif OPENAI_AVAILABLE:
                # Fallback to OpenAI client
                from openai import OpenAI
                client = OpenAI()
                
                response = client.embeddings.create(
                    input=text,
                    model=self.embedding_model
                )
                return response.data[0].embedding
            else:
                self._log_verbose("Neither litellm nor openai available for embeddings", logging.WARNING)
                return None
        except Exception as e:
            self._log_verbose(f"Error getting embedding: {e}", logging.ERROR)
            return None

    def _get_embedding_dimensions(self, model_name: str) -> int:
        """Get embedding dimensions based on model name."""
        # Common embedding model dimensions
        model_dimensions = {
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072,
            "text-embedding-ada-002": 1536,
            "text-embedding-002": 1536,
            # Add more models as needed
        }
        
        # Check if model name contains known model identifiers
        for model_key, dimensions in model_dimensions.items():
            if model_key in model_name.lower():
                return dimensions
        
        # Default to 1536 for unknown models (OpenAI standard)
        return 1536

    # -------------------------------------------------------------------------
    #                      Basic Quality Score Computation
    # -------------------------------------------------------------------------
    def compute_quality_score(
        self,
        completeness: float,
        relevance: float,
        clarity: float,
        accuracy: float,
        weights: Dict[str, float] = None
    ) -> float:
        """
        Combine multiple sub-metrics into one final score, as an example.

        Args:
            completeness (float): 0-1
            relevance (float): 0-1
            clarity (float): 0-1
            accuracy (float): 0-1
            weights (Dict[str, float]): optional weighting like {"completeness": 0.25, "relevance": 0.3, ...}

        Returns:
            float: Weighted average 0-1
        """
        if not weights:
            weights = {
                "completeness": 0.25,
                "relevance": 0.25,
                "clarity": 0.25,
                "accuracy": 0.25
            }
        total = (completeness * weights["completeness"]
                 + relevance   * weights["relevance"]
                 + clarity     * weights["clarity"]
                 + accuracy    * weights["accuracy"]
                )
        return round(total, 3)  # e.g. round to 3 decimal places

    # -------------------------------------------------------------------------
    #                           Short-Term Methods
    # -------------------------------------------------------------------------
    def store_short_term(
        self,
        text: str,
        metadata: Dict[str, Any] = None,
        completeness: float = None,
        relevance: float = None,
        clarity: float = None,
        accuracy: float = None,
        weights: Dict[str, float] = None,
        evaluator_quality: float = None
    ):
        """Store in short-term memory with optional quality metrics"""
        logger.info(f"Storing in short-term memory: {text[:100]}...")
        logger.info(f"Metadata: {metadata}")
        
        metadata = self._process_quality_metrics(
            metadata, completeness, relevance, clarity, 
            accuracy, weights, evaluator_quality
        )
        logger.info(f"Processed metadata: {metadata}")
        
        # Generate unique ID and timestamp once
        ident = str(time.time_ns())
        created_at = datetime.utcnow().isoformat()
        
        # Store in Supabase if enabled
        if self.use_supabase and hasattr(self, "supabase"):
            try:
                data = {
                    "id": ident,
                    "content": text,
                    "metadata": metadata,
                    "created_at": created_at,
                    "memory_type": "short_term"
                }
                self.supabase.table("short_term_memory").insert(data).execute()
                logger.info(f"Successfully stored in Supabase short-term memory with ID: {ident}")
            except Exception as e:
                logger.error(f"Failed to store in Supabase short-term memory: {e}")
                raise
        
        # Store in MongoDB if enabled (alternative backend)
        elif self.use_mongodb and hasattr(self, "mongo_short_term"):
            try:
                doc = {
                    "_id": ident,
                    "content": text,
                    "metadata": metadata,
                    "created_at": datetime.utcnow(),
                    "memory_type": "short_term"
                }
                self.mongo_short_term.insert_one(doc)
                logger.info(f"Successfully stored in MongoDB short-term memory with ID: {ident}")
            except Exception as e:
                logger.error(f"Failed to store in MongoDB short-term memory: {e}")
                raise
        else:
            logger.warning("No storage backend available for short-term memory")

    def search_short_term(
        self, 
        query: str, 
        limit: int = 5,
        min_quality: float = 0.0,
        relevance_cutoff: float = 0.0,
        rerank: bool = False,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search short-term memory with optional quality filter"""
        self._log_verbose(f"Searching short memory for: {query}")
        
        # Try Supabase first
        if self.use_supabase and hasattr(self, "supabase"):
            try:
                # Use text search in Supabase
                response = self.supabase.table("short_term_memory").select("*").ilike("content", f"%{query}%").limit(limit).execute()
                
                results = []
                for row in response.data:
                    metadata = row.get("metadata", {})
                    quality = metadata.get("quality", 0.0) if isinstance(metadata, dict) else 0.0
                    if quality >= min_quality:
                        results.append({
                            "id": row["id"],
                            "text": row["content"],
                            "metadata": metadata,
                            "score": 1.0  # Default score for text search
                        })
                return results
            except Exception as e:
                self._log_verbose(f"Error searching Supabase short-term memory: {e}", logging.ERROR)
                return []
            
        elif self.use_mongodb and hasattr(self, "mongo_short_term"):
            try:
                results = []
                
                # If vector search is enabled and we have embeddings
                if self.use_vector_search and hasattr(self, "_get_embedding"):
                    embedding = self._get_embedding(query)
                    if embedding:
                        # Vector search pipeline
                        pipeline = [
                            {
                                "$vectorSearch": {
                                    "index": "vector_index",
                                    "path": "embedding",
                                    "queryVector": embedding,
                                    "numCandidates": limit * 10,
                                    "limit": limit
                                }
                            },
                            {
                                "$addFields": {
                                    "score": {"$meta": "vectorSearchScore"}
                                }
                            },
                            {
                                "$match": {
                                    "metadata.quality": {"$gte": min_quality},
                                    "score": {"$gte": relevance_cutoff}
                                }
                            }
                        ]
                        
                        for doc in self.mongo_short_term.aggregate(pipeline):
                            results.append({
                                "id": str(doc["_id"]),
                                "text": doc["content"],
                                "metadata": doc.get("metadata", {}),
                                "score": doc.get("score", 1.0)
                            })
                
                # Fallback to text search if no vector results
                if not results:
                    search_filter = {
                        "$text": {"$search": query},
                        "metadata.quality": {"$gte": min_quality}
                    }
                    
                    for doc in self.mongo_short_term.find(search_filter).limit(limit):
                        results.append({
                            "id": str(doc["_id"]),
                            "text": doc["content"],
                            "metadata": doc.get("metadata", {}),
                            "score": 1.0  # Default score for text search
                        })
                
                return results
                
            except Exception as e:
                self._log_verbose(f"Error searching MongoDB short-term memory: {e}", logging.ERROR)
                return []
            
        elif self.use_qdrant and hasattr(self, "qdrant_client"):
            try:
                embedding = self._get_embedding(query)
                if not embedding:
                    return []
                
                results = self.qdrant_client.search(
                    collection_name=self.qdrant_collection,
                    query_vector=embedding,
                    limit=limit
                )
                
                filtered_results = []
                for result in results:
                    metadata = result.payload.get("metadata", {})
                    quality = metadata.get("quality", 0.0)
                    if quality >= min_quality and result.score >= relevance_cutoff:
                        filtered_results.append({
                            "id": str(result.id),
                            "text": result.payload["content"],
                            "metadata": metadata,
                            "score": result.score
                        })
                return filtered_results
            except Exception as e:
                self._log_verbose(f"Error searching Qdrant: {e}", logging.ERROR)
                return []
        
        else:
            # No storage backend available
            logger.warning("No storage backend available for short-term search")
            return []

    def reset_short_term(self):
        """Completely clears short-term memory."""
        if self.use_supabase and hasattr(self, "supabase"):
            try:
                self.supabase.table("short_term_memory").delete().neq("id", "").execute()
                self._log_verbose("Supabase short-term memory cleared")
            except Exception as e:
                logger.error(f"Error clearing Supabase short-term memory: {e}")
        elif self.use_mongodb and hasattr(self, "mongo_short_term"):
            try:
                self.mongo_short_term.delete_many({})
                self._log_verbose("MongoDB short-term memory cleared")
            except Exception as e:
                logger.error(f"Error clearing MongoDB short-term memory: {e}")

    # -------------------------------------------------------------------------
    #                           Long-Term Methods
    # -------------------------------------------------------------------------
    def _sanitize_metadata(self, metadata: Dict) -> Dict:
        """Sanitize metadata for vector store - convert to acceptable types"""
        sanitized = {}
        for k, v in metadata.items():
            if v is None:
                continue
            if isinstance(v, (str, int, float, bool)):
                sanitized[k] = v
            elif isinstance(v, dict):
                # Convert dict to string representation
                sanitized[k] = str(v)
            else:
                # Convert other types to string
                sanitized[k] = str(v)
        return sanitized

    def store_long_term(
        self,
        text: str,
        metadata: Dict[str, Any] = None,
        completeness: float = None,
        relevance: float = None,
        clarity: float = None,
        accuracy: float = None,
        weights: Dict[str, float] = None,
        evaluator_quality: float = None
    ):
        """Store in long-term memory with optional quality metrics"""
        logger.info(f"Storing in long-term memory: {text[:100]}...")
        logger.info(f"Initial metadata: {metadata}")
        
        # Process metadata
        metadata = metadata or {}
        metadata = self._process_quality_metrics(
            metadata, completeness, relevance, clarity,
            accuracy, weights, evaluator_quality
        )
        logger.info(f"Processed metadata: {metadata}")
        
        # Generate unique ID
        ident = str(time.time_ns())
        created_at = datetime.utcnow().isoformat()

        # Store in Supabase (first priority)
        if self.use_supabase and hasattr(self, "supabase"):
            try:
                data = {
                    "id": ident,
                    "content": text,
                    "metadata": metadata,
                    "created_at": created_at,
                    "memory_type": "long_term"
                }
                self.supabase.table("long_term_memory").insert(data).execute()
                logger.info(f"Successfully stored in Supabase long-term memory with ID: {ident}")
            except Exception as e:
                logger.error(f"Failed to store in Supabase long-term memory: {e}")
                return
        
        # Store in MongoDB if enabled (alternative backend)
        elif self.use_mongodb and hasattr(self, "mongo_long_term"):
            try:
                doc = {
                    "_id": ident,
                    "content": text,
                    "metadata": metadata,
                    "created_at": datetime.utcnow(),
                    "memory_type": "long_term"
                }
                
                # Add embedding if vector search is enabled
                if self.use_vector_search:
                    embedding = self._get_embedding(text)
                    if embedding:
                        doc["embedding"] = embedding
                
                self.mongo_long_term.insert_one(doc)
                logger.info(f"Successfully stored in MongoDB long-term memory with ID: {ident}")
            except Exception as e:
                logger.error(f"Failed to store in MongoDB long-term memory: {e}")
                return

        # Store in vector database (Qdrant) if enabled
        if self.use_qdrant and hasattr(self, "qdrant_client"):
            try:
                # Get embedding
                embedding = self._get_embedding(text)
                if not embedding:
                    logger.warning("Failed to get embedding for Qdrant storage")
                    return
                
                logger.info("Successfully got embeddings")
                logger.trace(f"Received embedding of length: {len(embedding)}")
                
                # Store in Qdrant with embedding
                self.qdrant_client.upsert(
                    collection_name=self.qdrant_collection,
                    points=[PointStruct(
                        id=ident,
                        vector=embedding,
                        payload={
                            "content": text,
                            "metadata": metadata,
                            "created_at": created_at,
                            "memory_type": "long_term"
                        }
                    )]
                )
                logger.info(f"Successfully stored in Qdrant with ID: {ident}")
            except Exception as e:
                logger.error(f"Error storing in Qdrant: {e}")


    def search_long_term(
        self, 
        query: str, 
        limit: int = 5, 
        relevance_cutoff: float = 0.0,
        min_quality: float = 0.0,
        rerank: bool = False,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search long-term memory with optional quality filter"""
        self._log_verbose(f"Searching long memory for: {query}")
        self._log_verbose(f"Min quality: {min_quality}")

        found = []

        # Try Supabase first
        if self.use_supabase and hasattr(self, "supabase"):
            try:
                response = self.supabase.table("long_term_memory").select("*").ilike("content", f"%{query}%").limit(limit).execute()
                
                for row in response.data:
                    metadata = row.get("metadata", {})
                    quality = metadata.get("quality", 0.0) if isinstance(metadata, dict) else 0.0
                    if quality >= min_quality:
                        text = row["content"]
                        # Add memory record citation
                        if "(Memory record:" not in text:
                            text = f"{text} (Memory record: {row['id']})"
                        found.append({
                            "id": row["id"],
                            "text": text,
                            "metadata": metadata,
                            "score": 1.0  # Default score for text search
                        })
                logger.info(f"Found {len(found)} results in Supabase")
            except Exception as e:
                self._log_verbose(f"Error searching Supabase long-term memory: {e}", logging.ERROR)

        # Try MongoDB as alternative
        elif self.use_mongodb and hasattr(self, "mongo_long_term"):
            try:
                results = []
                
                # If vector search is enabled and we have embeddings
                if self.use_vector_search:
                    embedding = self._get_embedding(query)
                    if embedding:
                        # Vector search pipeline
                        pipeline = [
                            {
                                "$vectorSearch": {
                                    "index": "vector_index",
                                    "path": "embedding",
                                    "queryVector": embedding,
                                    "numCandidates": limit * 10,
                                    "limit": limit
                                }
                            },
                            {
                                "$addFields": {
                                    "score": {"$meta": "vectorSearchScore"}
                                }
                            },
                            {
                                "$match": {
                                    "metadata.quality": {"$gte": min_quality},
                                    "score": {"$gte": relevance_cutoff}
                                }
                            }
                        ]
                        
                        for doc in self.mongo_long_term.aggregate(pipeline):
                            text = doc["content"]
                            # Add memory record citation
                            if "(Memory record:" not in text:
                                text = f"{text} (Memory record: {str(doc['_id'])})"
                            results.append({
                                "id": str(doc["_id"]),
                                "text": text,
                                "metadata": doc.get("metadata", {}),
                                "score": doc.get("score", 1.0)
                            })
                
                # Fallback to text search if no vector results
                if not results:
                    search_filter = {
                        "$text": {"$search": query},
                        "metadata.quality": {"$gte": min_quality}
                    }
                    
                    for doc in self.mongo_long_term.find(search_filter).limit(limit):
                        text = doc["content"]
                        # Add memory record citation
                        if "(Memory record:" not in text:
                            text = f"{text} (Memory record: {str(doc['_id'])})"
                        results.append({
                            "id": str(doc["_id"]),
                            "text": text,
                            "metadata": doc.get("metadata", {}),
                            "score": 1.0  # Default score for text search
                        })
                
                logger.info(f"Found {len(results)} results in MongoDB")
                return results
                
            except Exception as e:
                self._log_verbose(f"Error searching MongoDB long-term memory: {e}", logging.ERROR)
                # Fall through to SQLite search

        # Try Qdrant for vector search
        if self.use_qdrant and hasattr(self, "qdrant_client"):
            try:
                embedding = self._get_embedding(query)
                if embedding:
                    results = self.qdrant_client.search(
                        collection_name=self.qdrant_collection,
                        query_vector=embedding,
                        limit=limit
                    )
                    
                    for result in results:
                        metadata = result.payload.get("metadata", {})
                        quality = metadata.get("quality", 0.0)
                        if quality >= min_quality and result.score >= relevance_cutoff:
                            text = result.payload["content"]
                            # Add memory record citation
                            if "(Memory record:" not in text:
                                text = f"{text} (Memory record: {str(result.id)})"
                            found.append({
                                "id": str(result.id),
                                "text": text,
                                "metadata": metadata,
                                "score": result.score
                            })
                    logger.info(f"Found {len(found)} results in Qdrant")
            except Exception as e:
                self._log_verbose(f"Error searching Qdrant: {e}", logging.ERROR)
        
        logger.info(f"Found {len(found)} total results")

        results = found

        # Filter by quality if needed
        if min_quality > 0:
            self._log_verbose(f"Found {len(results)} initial results")
            results = [
                r for r in results 
                if r.get("metadata", {}).get("quality", 0.0) >= min_quality
            ]
            self._log_verbose(f"After quality filter: {len(results)} results")

        # Apply relevance cutoff if specified
        if relevance_cutoff > 0:
            results = [r for r in results if r.get("score", 1.0) >= relevance_cutoff]
            logger.info(f"After relevance filter: {len(results)} results")
        
        return results[:limit]

    def reset_long_term(self):
        """Clear long-term memory from Supabase, Qdrant, or MongoDB."""
        if self.use_supabase and hasattr(self, "supabase"):
            try:
                self.supabase.table("long_term_memory").delete().neq("id", "").execute()
                self._log_verbose("Supabase long-term memory cleared")
            except Exception as e:
                self._log_verbose(f"Error clearing Supabase long-term memory: {e}", logging.ERROR)
        
        if self.use_mongodb and hasattr(self, "mongo_long_term"):
            try:
                self.mongo_long_term.delete_many({})
                self._log_verbose("MongoDB long-term memory cleared")
            except Exception as e:
                self._log_verbose(f"Error clearing MongoDB long-term memory: {e}", logging.ERROR)
        
        if self.use_qdrant and hasattr(self, "qdrant_client"):
            try:
                # Delete and recreate collection
                self.qdrant_client.delete_collection(self.qdrant_collection)
                self.qdrant_client.create_collection(
                    collection_name=self.qdrant_collection,
                    vectors_config=VectorParams(
                        size=self.embedding_dimensions,
                        distance=Distance.COSINE
                    )
                )
                self._log_verbose("Qdrant collection reset")
            except Exception as e:
                self._log_verbose(f"Error resetting Qdrant: {e}", logging.ERROR)

    # -------------------------------------------------------------------------
    #                       Entity Memory Methods
    # -------------------------------------------------------------------------
    def store_entity(self, name: str, type_: str, desc: str, relations: str):
        """
        Save entity info in LTM (or mem0/rag). 
        We'll label the metadata type = entity for easy filtering.
        """
        data = f"Entity {name}({type_}): {desc} | relationships: {relations}"
        self.store_long_term(data, metadata={"category": "entity"})

    def search_entity(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Filter to items that have metadata 'category=entity'.
        """
        all_hits = self.search_long_term(query, limit=20)  # gather more
        ents = []
        for h in all_hits:
            meta = h.get("metadata") or {}
            if meta.get("category") == "entity":
                ents.append(h)
        return ents[:limit]

    def reset_entity_only(self):
        """
        If you only want to drop entity items from LTM, you'd do a custom 
        delete from local DB where meta LIKE '%category=entity%'. 
        For brevity, we do a full LTM reset here.
        """
        self.reset_long_term()

    # -------------------------------------------------------------------------
    #                       User Memory Methods
    # -------------------------------------------------------------------------
    def store_user_memory(self, user_id: str, text: str, extra: Dict[str, Any] = None):
        """
        If mem0 is used, do user-based addition. Otherwise store in LTM with user in metadata.
        """
        meta = {"user_id": user_id}
        if extra:
            meta.update(extra)

        if self.use_mem0 and hasattr(self, "mem0_client"):
            self.mem0_client.add(text, user_id=user_id, metadata=meta)
        elif self.use_mongodb and hasattr(self, "mongo_users"):
            try:
                from datetime import datetime
                ident = str(time.time_ns())
                doc = {
                    "_id": ident,
                    "user_id": user_id,
                    "content": text,
                    "metadata": meta,
                    "created_at": datetime.utcnow()
                }
                self.mongo_users.insert_one(doc)
                self._log_verbose(f"Successfully stored user memory for {user_id}")
            except Exception as e:
                self._log_verbose(f"Error storing user memory: {e}", logging.ERROR)
        else:
            self.store_long_term(text, metadata=meta)

    def search_user_memory(self, user_id: str, query: str, limit: int = 5, rerank: bool = False, **kwargs) -> List[Dict[str, Any]]:
        """
        If mem0 is used, pass user_id in. Otherwise fallback to local filter on user in metadata.
        """
        if self.use_mem0 and hasattr(self, "mem0_client"):
            # Pass rerank and other kwargs to Mem0 search
            search_params = {"query": query, "limit": limit, "user_id": user_id, "rerank": rerank}
            search_params.update(kwargs)
            return self.mem0_client.search(**search_params)
        elif self.use_mongodb and hasattr(self, "mongo_users"):
            try:
                results = []
                search_filter = {
                    "user_id": user_id,
                    "$text": {"$search": query}
                }
                
                for doc in self.mongo_users.find(search_filter).limit(limit):
                    results.append({
                        "id": str(doc["_id"]),
                        "text": doc["content"],
                        "metadata": doc.get("metadata", {}),
                        "score": 1.0
                    })
                
                return results
            except Exception as e:
                self._log_verbose(f"Error searching MongoDB user memory: {e}", logging.ERROR)
                return []
        else:
            hits = self.search_long_term(query, limit=20)
            filtered = []
            for h in hits:
                meta = h.get("metadata", {})
                if meta.get("user_id") == user_id:
                    filtered.append(h)
            return filtered[:limit]

    def search(self, query: str, user_id: Optional[str] = None, agent_id: Optional[str] = None, 
               run_id: Optional[str] = None, limit: int = 5, rerank: bool = False, **kwargs) -> List[Dict[str, Any]]:
        """
        Generic search method that delegates to appropriate specific search methods.
        Provides compatibility with mem0.Memory interface.
        
        Args:
            query: The search query string
            user_id: Optional user ID for user-specific search
            agent_id: Optional agent ID for agent-specific search  
            run_id: Optional run ID for run-specific search
            limit: Maximum number of results to return
            rerank: Whether to use advanced reranking
            **kwargs: Additional search parameters
            
        Returns:
            List of search results
        """
        # If using mem0, pass all parameters directly
        if self.use_mem0 and hasattr(self, "mem0_client"):
            search_params = {
                "query": query,
                "limit": limit,
                "rerank": rerank
            }
            
            # Add optional parameters if provided
            if user_id is not None:
                search_params["user_id"] = user_id
            if agent_id is not None:
                search_params["agent_id"] = agent_id
            if run_id is not None:
                search_params["run_id"] = run_id
                
            # Include any additional kwargs
            search_params.update(kwargs)
            
            return self.mem0_client.search(**search_params)
        
        # For MongoDB or local memory, use specific search methods
        if user_id:
            # Use user-specific search
            return self.search_user_memory(user_id, query, limit=limit, rerank=rerank, **kwargs)
        else:
            # Default to long-term memory search
            # Note: agent_id and run_id filtering could be added to metadata filtering in the future
            return self.search_long_term(query, limit=limit, rerank=rerank, **kwargs)

    def reset_user_memory(self):
        """
        Clear all user-based info. For simplicity, we do a full LTM reset. 
        Real usage might filter only metadata "user_id".
        """
        self.reset_long_term()

    # -------------------------------------------------------------------------
    #                 Putting it all Together: Task Finalization
    # -------------------------------------------------------------------------
    def finalize_task_output(
        self,
        content: str,
        agent_name: str,
        quality_score: float,
        threshold: float = 0.7,
        metrics: Dict[str, Any] = None,
        task_id: str = None
    ):
        """Store task output in memory with appropriate metadata"""
        logger.info(f"Finalizing task output: {content[:100]}...")
        logger.info(f"Agent: {agent_name}, Quality: {quality_score}, Threshold: {threshold}")
        
        metadata = {
            "task_id": task_id,
            "agent": agent_name,
            "quality": quality_score,
            "metrics": metrics,
            "task_type": "output",
            "stored_at": time.time()
        }
        logger.info(f"Prepared metadata: {metadata}")
        
        # Always store in short-term memory
        try:
            logger.info("Storing in short-term memory...")
            self.store_short_term(
                text=content,
                metadata=metadata
            )
            logger.info("Successfully stored in short-term memory")
        except Exception as e:
            logger.error(f"Failed to store in short-term memory: {e}")
        
        # Store in long-term memory if quality meets threshold
        if quality_score >= threshold:
            try:
                logger.info(f"Quality score {quality_score} >= {threshold}, storing in long-term memory...")
                self.store_long_term(
                    text=content,
                    metadata=metadata
                )
                logger.info("Successfully stored in long-term memory")
            except Exception as e:
                logger.error(f"Failed to store in long-term memory: {e}")
        else:
            logger.info(f"Quality score {quality_score} < {threshold}, skipping long-term storage")

    # -------------------------------------------------------------------------
    #                 Building Context (Short, Long, Entities, User)
    # -------------------------------------------------------------------------
    def build_context_for_task(
        self,
        task_descr: str,
        user_id: Optional[str] = None,
        additional: str = "",
        max_items: int = 3,
        include_in_output: Optional[bool] = None
    ) -> str:
        """
        Merges relevant short-term, long-term, entity, user memories
        into a single text block with deduplication and clean formatting.
        
        Args:
            include_in_output: If None, memory content is only included when debug logging is enabled.
                               If True, memory content is always included.
                               If False, memory content is never included (only logged for debugging).
        """
        # Determine whether to include memory content in output based on logging level
        if include_in_output is None:
            include_in_output = logging.getLogger().getEffectiveLevel() == logging.DEBUG
        
        q = (task_descr + " " + additional).strip()
        lines = []
        seen_contents = set()  # Track unique contents

        def normalize_content(content: str) -> str:
            """Normalize content for deduplication"""
            # Extract just the main content without citations for comparison
            normalized = content.split("(Memory record:")[0].strip()
            # Keep more characters to reduce false duplicates
            normalized = ''.join(c.lower() for c in normalized if not c.isspace())
            return normalized

        def format_content(content: str, max_len: int = 150) -> str:
            """Format content with clean truncation at word boundaries"""
            if not content:
                return ""
            
            # Clean up content by removing extra whitespace and newlines
            content = ' '.join(content.split())
            
            # If content contains a memory citation, preserve it
            if "(Memory record:" in content:
                return content  # Keep original citation format
            
            # Regular content truncation
            if len(content) <= max_len:
                return content
            
            truncate_at = content.rfind(' ', 0, max_len - 3)
            if truncate_at == -1:
                truncate_at = max_len - 3
            return content[:truncate_at] + "..."

        def add_section(title: str, hits: List[Any]) -> None:
            """Add a section of memory hits with deduplication"""
            if not hits:
                return
                
            formatted_hits = []
            for h in hits:
                content = h.get('text', '') if isinstance(h, dict) else str(h)
                if not content:
                    continue
                    
                # Keep original format if it has a citation
                if "(Memory record:" in content:
                    formatted = content
                else:
                    formatted = format_content(content)
                
                # Only add if we haven't seen this normalized content before
                normalized = normalize_content(formatted)
                if normalized not in seen_contents:
                    seen_contents.add(normalized)
                    formatted_hits.append(formatted)
            
            if formatted_hits:
                # Log detailed memory content for debugging including section headers
                brief_title = title.replace(" Context", "").replace("Memory ", "")
                logger.debug(f"Memory section '{brief_title}' ({len(formatted_hits)} items): {formatted_hits}")
                
                # Only include memory content in output when specified (controlled by log level or explicit parameter)
                if include_in_output:
                    # Add only the actual memory content for AI agent use (no headers)
                    if lines:
                        lines.append("")  # Space before new section
                    
                    # Include actual memory content without verbose section headers
                    for hit in formatted_hits:
                        lines.append(f"• {hit}")
                    lines.append("")  # Space after content

        # Add each section
        # First get all results
        short_term = self.search_short_term(q, limit=max_items)
        long_term = self.search_long_term(q, limit=max_items)
        entities = self.search_entity(q, limit=max_items)
        user_mem = self.search_user_memory(user_id, q, limit=max_items) if user_id else []

        # Add sections in order of priority
        add_section("Short-term Memory Context", short_term)
        add_section("Long-term Memory Context", long_term)
        add_section("Entity Context", entities)
        if user_id:
            add_section("User Context", user_mem)

        return "\n".join(lines) if lines else ""

    # -------------------------------------------------------------------------
    #                      Master Reset (Everything)
    # -------------------------------------------------------------------------
    def reset_all(self):
        """
        Fully wipes short-term, long-term, and any memory in mem0 or rag.
        """
        self.reset_short_term()
        self.reset_long_term()
        # Entities & user memory are stored in LTM or mem0, so no separate step needed.

    def _process_quality_metrics(
        self,
        metadata: Dict[str, Any],
        completeness: float = None,
        relevance: float = None,
        clarity: float = None, 
        accuracy: float = None,
        weights: Dict[str, float] = None,
        evaluator_quality: float = None
    ) -> Dict[str, Any]:
        """Process and store quality metrics in metadata"""
        metadata = metadata or {}
        
        # Handle sub-metrics if provided
        if None not in [completeness, relevance, clarity, accuracy]:
            metadata.update({
                "completeness": completeness,
                "relevance": relevance,
                "clarity": clarity,
                "accuracy": accuracy,
                "quality": self.compute_quality_score(
                    completeness, relevance, clarity, accuracy, weights
                )
            })
        # Handle external evaluator quality if provided
        elif evaluator_quality is not None:
            metadata["quality"] = evaluator_quality
        
        return metadata

    def calculate_quality_metrics(
        self,
        output: str,
        expected_output: str,
        llm: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, float]:
        """Calculate quality metrics using LLM"""
        logger.info("Calculating quality metrics for output")
        logger.info(f"Output: {output[:100]}...")
        logger.info(f"Expected: {expected_output[:100]}...")
        
        # Default evaluation prompt
        default_prompt = f"""
        Evaluate the following output against expected output.
        Score each metric from 0.0 to 1.0:
        - Completeness: Does it address all requirements?
        - Relevance: Does it match expected output?
        - Clarity: Is it clear and well-structured?
        - Accuracy: Is it factually correct?

        Expected: {expected_output}
        Actual: {output}

        Return ONLY a JSON with these keys: completeness, relevance, clarity, accuracy
        Example: {{"completeness": 0.95, "relevance": 0.8, "clarity": 0.9, "accuracy": 0.85}}
        """

        try:
            if LITELLM_AVAILABLE:
                # Use LiteLLM for consistency with the rest of the codebase
                import litellm
                
                # Convert model name if it's in litellm format
                model_name = llm or "gpt-5-nano"
                
                response = litellm.completion(
                    model=model_name,
                    messages=[{
                        "role": "user", 
                        "content": custom_prompt or default_prompt
                    }],
                    response_format={"type": "json_object"},
                    temperature=0.3
                )
            elif OPENAI_AVAILABLE:
                # Fallback to OpenAI client
                from openai import OpenAI
                client = OpenAI()
                
                response = client.chat.completions.create(
                    model=llm or "gpt-5-nano",
                    messages=[{
                        "role": "user", 
                        "content": custom_prompt or default_prompt
                    }],
                    response_format={"type": "json_object"},
                    temperature=0.3
                )
            else:
                logger.error("Neither litellm nor openai available for quality calculation")
                return {
                    "completeness": 0.0,
                    "relevance": 0.0,
                    "clarity": 0.0,
                    "accuracy": 0.0
                }
            
            metrics = json.loads(response.choices[0].message.content)
            
            # Validate metrics
            required = ["completeness", "relevance", "clarity", "accuracy"]
            if not all(k in metrics for k in required):
                raise ValueError("Missing required metrics in LLM response")
            
            logger.info(f"Calculated metrics: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {e}")
            return {
                "completeness": 0.0,
                "relevance": 0.0,
                "clarity": 0.0,
                "accuracy": 0.0
            }

    def store_quality(
        self,
        text: str,
        quality_score: float,
        task_id: Optional[str] = None,
        iteration: Optional[int] = None,
        metrics: Optional[Dict[str, float]] = None,
        memory_type: Literal["short", "long"] = "long"
    ) -> None:
        """Store quality metrics in memory"""
        logger.info(f"Attempting to store in {memory_type} memory: {text[:100]}...")
        
        metadata = {
            "quality": quality_score,
            "task_id": task_id,
            "iteration": iteration
        }
        
        if metrics:
            metadata.update({
                k: v for k, v in metrics.items()  # Remove metric_ prefix
            })
            
        logger.info(f"With metadata: {metadata}")
        
        try:
            if memory_type == "short":
                self.store_short_term(text, metadata=metadata)
                logger.info("Successfully stored in short-term memory")
            else:
                self.store_long_term(text, metadata=metadata)
                logger.info("Successfully stored in long-term memory")
        except Exception as e:
            logger.error(f"Failed to store in memory: {e}")

    def search_with_quality(
        self,
        query: str,
        min_quality: float = 0.0,
        memory_type: Literal["short", "long"] = "long",
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search with quality filter"""
        logger.info(f"Searching {memory_type} memory for: {query}")
        logger.info(f"Min quality: {min_quality}")
        
        search_func = (
            self.search_short_term if memory_type == "short" 
            else self.search_long_term
        )
        
        results = search_func(query, limit=limit)
        logger.info(f"Found {len(results)} initial results")
        
        filtered = [
            r for r in results 
            if r.get("metadata", {}).get("quality", 0.0) >= min_quality
        ]
        logger.info(f"After quality filter: {len(filtered)} results")
        
        return filtered

    def get_all_memories(self) -> List[Dict[str, Any]]:
        """Get all memories from both short-term and long-term storage"""
        all_memories = []
        
        try:
            if self.use_supabase and hasattr(self, "supabase"):
                # Get short-term memories from Supabase
                response_short = self.supabase.table("short_term_memory").select("*").execute()
                for row in response_short.data:
                    all_memories.append({
                        "id": row["id"],
                        "text": row["content"],
                        "metadata": row.get("metadata", {}),
                        "created_at": row.get("created_at"),
                        "type": "short_term"
                    })
                
                # Get long-term memories from Supabase
                response_long = self.supabase.table("long_term_memory").select("*").execute()
                for row in response_long.data:
                    all_memories.append({
                        "id": row["id"],
                        "text": row["content"],
                        "metadata": row.get("metadata", {}),
                        "created_at": row.get("created_at"),
                        "type": "long_term"
                    })
            
            elif self.use_mongodb:
                # Get from MongoDB if that's the backend
                if hasattr(self, "mongo_short_term"):
                    for doc in self.mongo_short_term.find():
                        all_memories.append({
                            "id": str(doc["_id"]),
                            "text": doc["content"],
                            "metadata": doc.get("metadata", {}),
                            "created_at": doc.get("created_at"),
                            "type": "short_term"
                        })
                
                if hasattr(self, "mongo_long_term"):
                    for doc in self.mongo_long_term.find():
                        all_memories.append({
                            "id": str(doc["_id"]),
                            "text": doc["content"],
                            "metadata": doc.get("metadata", {}),
                            "created_at": doc.get("created_at"),
                            "type": "long_term"
                        })
            
            return all_memories
            
        except Exception as e:
            self._log_verbose(f"Error getting all memories: {e}", logging.ERROR)
            return []
