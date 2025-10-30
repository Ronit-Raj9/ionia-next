# 🎓 Ionia LMS Backend

**Production-Grade FastAPI Backend with Supabase, SQLAlchemy, and AI Stack**

A modern, scalable Learning Management System backend built with FastAPI, featuring role-based access control, AI-powered grading, personalized assignments, and comprehensive analytics.

---

## 📚 **Table of Contents**

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)

---

## 🛠️ **Tech Stack**

### **Core Framework**
- **FastAPI** (v0.115+) - Modern async web framework
- **Uvicorn** + **Gunicorn** - ASGI server with multi-worker support
- **Pydantic** (v2+) - Data validation and settings management

### **Database & ORM**
- **Supabase** - Auth, Storage, and Managed PostgreSQL
- **SQLAlchemy** (v2.0+ Async) - Modern async ORM
- **Alembic** - Database migrations
- **asyncpg** - Fast async PostgreSQL driver

### **AI & Machine Learning**
- **LiteLLM** (v1.72+) - Unified LLM router with failover (Gemini, DeepSeek, Groq, OpenAI)
- **PraisonAI Agents** - Multi-agent workflow automation
- **Google Cloud Vision** - OCR for handwritten submissions
- **Qdrant** - Vector database for RAG and semantic search
- **Sentence Transformers** - Embedding generation for personalization

### **Background Tasks & Caching**
- **Celery** + **Redis** - Distributed task queue for async operations
- **Flower** - Real-time Celery monitoring

### **Security & Auth**
- **Supabase Auth** - Email/password + Google OAuth
- **python-jose** - JWT token management
- **Row-Level Security (RLS)** - Database-level access control

### **Utilities & Tools**
- **Loguru** - Structured logging with rotation
- **aiofiles** - Async file operations
- **httpx** - Async HTTP client
- **Pillow** - Image processing
- **Pandas** - Data manipulation for analytics
- **ReportLab** + **OpenPyXL** - PDF and Excel exports

### **Development & Testing**
- **Pytest** + **pytest-asyncio** - Async testing framework
- **Black** - Code formatter
- **Ruff** - Fast Python linter
- **MyPy** - Static type checking

---

## ✨ **Features**

### **Phase 1: Core LMS Functionality**

#### **1. Assignment System**
- 📤 CBSE material upload (PDF, images, audio, text)
- 🤖 AI-powered question generation from uploaded content
- 🎯 Personalized assignments based on student profiles
- 📊 Assignment analytics and completion tracking

#### **2. AI Grading**
- 🔍 Automatic grading with confidence scores
- 📸 OCR support for handwritten submissions
- ✏️ Manual override by teachers
- 📈 Question-wise breakdown and feedback

#### **3. Student Dashboard**
- 👤 Quick personality quiz for learning profiles
- 📱 PWA support with offline mode
- 📋 Assignment tracking and submission
- 📊 Performance analytics and progress visualization

#### **4. Analytics & Insights**
- 📈 Real-time progress tracking
- 📉 Performance trends by subject/topic
- 📄 Export to PDF and Excel
- 🎯 Personalization effectiveness metrics

#### **5. Lesson Planning (Admin/Teacher)**
- 📚 AI-generated weekly lesson plans
- 📁 Resource management
- 📅 Curriculum mapping

#### **6. Ethical Monitoring**
- 🔐 Complete audit trail for all AI operations
- ⚖️ Bias detection in AI responses
- 📝 Transparent logging for compliance

---

## 🏗️ **Architecture**

### **Project Structure**

```
lms_backend/
├── app/
│   ├── main.py                         # FastAPI application entry point
│   │
│   ├── core/                           # Core infrastructure
│   │   ├── config.py                   # Central secrets manager
│   │   ├── supabase_client.py          # Supabase initialization
│   │   ├── security.py                 # JWT & RBAC
│   │   ├── logger.py                   # Loguru configuration
│   │   ├── ai_config.py                # AI stack setup (LiteLLM, Qdrant, etc.)
│   │   ├── celery_app.py               # Celery configuration
│   │   ├── events.py                   # Application lifecycle events
│   │   └── constants.py                # Application constants
│   │
│   ├── api/                            # API layer
│   │   ├── v1/
│   │   │   ├── routes/                 # API endpoints
│   │   │   │   ├── auth_routes.py      # Authentication
│   │   │   │   ├── assignment_routes.py
│   │   │   │   ├── grading_routes.py
│   │   │   │   ├── student_routes.py
│   │   │   │   ├── analytics_routes.py
│   │   │   │   ├── lesson_routes.py
│   │   │   │   ├── admin_routes.py
│   │   │   │   └── audit_routes.py
│   │   │   │
│   │   │   └── dependencies/           # FastAPI dependencies
│   │   │       ├── supabase_auth.py    # Auth dependencies
│   │   │       └── role_guard.py       # RBAC guards
│   │   │
│   │   ├── responses.py                # Standardized responses
│   │   ├── errors.py                   # Error models
│   │   └── exceptions.py               # Custom exceptions
│   │
│   ├── db/                             # Database layer
│   │   ├── base.py                     # SQLAlchemy async setup
│   │   └── models/                     # SQLAlchemy models
│   │       ├── user_model.py
│   │       ├── assignment_model.py
│   │       ├── submission_model.py
│   │       ├── grade_model.py
│   │       ├── profile_model.py
│   │       ├── analytics_model.py
│   │       └── ...
│   │
│   ├── services/                       # Business logic
│   │   ├── assignment_service.py
│   │   ├── grading_service.py
│   │   ├── student_service.py
│   │   ├── analytics_service.py
│   │   └── ai/                         # AI services
│   │       ├── llm_service.py
│   │       ├── embedding_service.py
│   │       ├── rag_service.py
│   │       ├── ocr_service.py
│   │       └── personalization_service.py
│   │
│   ├── schemas/                        # Pydantic schemas
│   │   ├── auth_schema.py
│   │   ├── assignment_schema.py
│   │   └── ...
│   │
│   ├── middleware/                     # Middleware
│   │   ├── error_handler.py
│   │   ├── audit_logger.py
│   │   └── rate_limiter.py
│   │
│   ├── utils/                          # Utilities
│   │   ├── file_utils.py
│   │   ├── export_utils.py
│   │   └── validation_utils.py
│   │
│   └── tasks/                          # Background tasks
│       ├── background_tasks.py
│       └── notification_tasks.py
│
├── tests/                              # Test suite
├── scripts/                            # Utility scripts
├── supabase/                           # Database schema & migrations
├── config/                             # Configuration files
│   ├── litellms_config.yaml
│   ├── qdrant_config.yaml
│   └── logging_config.yaml
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Python 3.11+
- Docker & Docker Compose
- Supabase account
- Google Cloud account (for OCR and Gemini)

### **1. Clone the Repository**

```bash
cd lms_backend
```

### **2. Set Up Environment**

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### **3. Start Infrastructure (Docker)**

```bash
# Start Redis and Qdrant
docker-compose up -d redis qdrant
```

### **4. Install Dependencies**

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### **5. Run Database Migrations**

```bash
# Initialize Alembic (first time only)
alembic init supabase/migrations

# Run migrations
alembic upgrade head
```

### **6. Start the Server**

```bash
# Development server
./run.sh

# Or manually:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **7. Start Background Workers**

```bash
# Terminal 1: Celery worker
celery -A app.core.celery_app.celery_app worker --loglevel=info

# Terminal 2: Celery beat (for scheduled tasks)
celery -A app.core.celery_app.celery_app beat --loglevel=info

# Terminal 3: Flower (monitoring UI)
celery -A app.core.celery_app.celery_app flower
```

---

## ⚙️ **Configuration**

### **Environment Variables**

See `.env.example` for a complete list. Key variables:

#### **Supabase**
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret"
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
```

#### **AI Providers**
```env
GOOGLE_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="sk-your-openai-key"
DEEPSEEK_API_KEY="sk-your-deepseek-key"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

#### **Redis & Celery**
```env
REDIS_URL="redis://localhost:6379/0"
CELERY_BROKER_URL="redis://localhost:6379/0"
```

#### **Qdrant**
```env
QDRANT_URL="http://localhost:6333"
QDRANT_COLLECTION_NAME="cbse_questions"
```

---

## 🧪 **Testing**

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_assignments.py

# Run async tests only
pytest -k async
```

---

## 📦 **Deployment**

### **Docker Production Build**

```bash
# Build image
docker build -t ionia-lms-backend .

# Run with Docker Compose
docker-compose up --build
```

### **Cloud Deployment**

**Recommended:** Deploy on **Railway**, **Render**, or **Fly.io**

1. Connect your Git repository
2. Set environment variables from `.env.example`
3. Deploy!

---

## 📖 **API Documentation**

Once the server is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License.

---

## 📞 **Support**

For questions or support:
- 📧 Email: support@ionia.app
- 📚 Documentation: [docs.ionia.app](https://docs.ionia.app)
- 💬 Discord: [discord.gg/ionia](https://discord.gg/ionia)

---

**Built with ❤️ by the Ionia Team**
