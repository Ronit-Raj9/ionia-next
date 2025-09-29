# Ionia - Phase 1 MVP

An intelligent Learning Management System with AI-powered assignment personalization and automated grading.

## 🚀 Features

### Phase 1 Core Features
- **Automated Assignment Distribution**: Teachers upload assignments, AI personalizes for each student
- **Instant Homework Grading**: AI grades submissions with detailed feedback using OCR for handwritten work
- **Basic Progress Tracking**: Real-time analytics and class performance heatmaps

### Key Capabilities
- **Role-based Access**: Teacher, Student, and Admin interfaces
- **AI Personalization**: Adapts questions based on student weaknesses, personality, and learning style
- **OCR Support**: Processes handwritten math submissions using Google Vision API
- **Real-time Grading**: Groq LLM provides instant feedback and scoring
- **Progress Analytics**: Class heatmaps and individual student progress tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **AI Services**: 
  - Groq (llama3-8b-8192) - Primary AI for personalization and grading
  - OpenAI (gpt-4o-mini) - Fallback for complex analysis
  - Google Cloud Vision - OCR for handwritten submissions
- **File Storage**: Cloudinary
- **State Management**: Zustand with Immer

## 📋 Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Groq API key
- Google Cloud Vision API credentials
- OpenAI API key
- Cloudinary account

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/IoniaDB?retryWrites=true&w=majority

# AI Services
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GOOGLE_CLOUD_CLIENT_ID=your_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
```

### 3. API Setup

#### Groq API
1. Sign up at [console.groq.com](https://console.groq.com)
2. Generate an API key
3. Note: Uses `llama3-8b-8192` model for fast inference

#### Google Cloud Vision
1. Create project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Vision API
3. Create service account and download JSON key
4. Extract credentials to environment variables

#### OpenAI API
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Used as fallback for complex analysis

#### Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get cloud name, API key, and secret
3. Used for file uploads and storage

### 4. Database Setup

The app uses MongoDB Atlas with automatic schema creation. Collections will be created automatically:
- `users` - User roles and basic info
- `classes` - Class groupings
- `studentProfiles` - Learning profiles for personalization
- `assignments` - Teacher-created assignments with personalized versions
- `submissions` - Student submissions and grades
- `progress` - Progress tracking and analytics

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## 🎯 Usage Guide

### Getting Started

1. **Visit the Landing Page**: Navigate to `http://localhost:3001`
2. **Select Role**: Choose Teacher, Student (1-20), or Admin
3. **Seed Demo Data** (Admin): Use the "Seed Demo Data" button to populate the database

### Teacher Workflow

1. **Create Assignment**: Upload math questions (text or image)
2. **AI Personalization**: System automatically personalizes for all 20 students
3. **Monitor Progress**: View class heatmap and individual student performance

### Student Workflow

1. **View Assignments**: See personalized questions tailored to your profile
2. **Submit Answers**: Upload handwritten work or type answers
3. **Instant Feedback**: Receive AI-generated grades and feedback
4. **Track Progress**: Monitor your learning analytics

### Admin Workflow

1. **Class Analytics**: View comprehensive class performance data
2. **System Management**: Seed data, refresh analytics, export reports
3. **Heatmap Analysis**: Identify class-wide learning gaps

## 🧪 Demo Data

The system includes a seeding script that creates:
- 1 Teacher (teacher1)
- 20 Students (student1-student20) with varied learning profiles
- 1 Admin (admin1)
- Sample assignments and progress data
- Realistic weakness patterns and personality types

## 🔍 Key Features Explained

### AI Personalization
- Analyzes student weaknesses (algebra, fractions, geometry, etc.)
- Considers personality types (visual, analytical, collaborative)
- Adapts question difficulty and presentation style
- Includes remedial content for struggling areas

### Instant Grading
- OCR processes handwritten math work
- AI evaluates methodology and accuracy
- Provides detailed feedback and error identification
- Updates student profiles based on performance

### Progress Analytics
- Real-time class performance heatmaps
- Individual student learning trajectories
- Time-saving metrics for teachers
- Exportable progress reports

## 🚧 Development Notes

### Simplified Authentication
- No complex JWT or session management
- Role selection via localStorage for demo purposes
- Production deployment would require proper authentication

### API Rate Limits
- Groq: Monitor usage in console
- Google Vision: Free tier covers demo usage
- OpenAI: Used sparingly as fallback

### File Upload Limits
- Images: 10MB max per file
- Supported formats: JPG, PNG, GIF, WebP, PDF, TXT

## 📊 Performance Metrics

### Target Metrics (Phase 1)
- **Teacher Time Saved**: 10-15 hours/week on grading
- **Grading Speed**: <1 minute for 20 submissions
- **Personalization Accuracy**: 95%+ relevant adaptations
- **OCR Accuracy**: 90%+ for clear handwriting

### Demo Scope
- **Class Size**: 20 students
- **Subject Focus**: Mathematics (CBSE/ICSE aligned)
- **Assignment Types**: Problem-solving, calculations, word problems

## 🔮 Future Enhancements (Phase 2+)

- Advanced teacher dashboards
- Student gamification features
- Multi-subject support
- Parent reporting
- Mobile app
- Offline mode
- Multi-language support

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Verify MongoDB URI and network access
2. **API Errors**: Check API keys and rate limits
3. **File Upload Issues**: Ensure Cloudinary credentials are correct
4. **OCR Problems**: Verify Google Cloud Vision setup

### Development Tips

- Use browser dev tools to monitor API calls
- Check console for detailed error messages
- Test with clear, well-lit handwritten samples
- Monitor API usage in respective dashboards

## 📝 License

This project is for demonstration purposes as part of the Ionia MVP development.

---

**Built with ❤️ for the future of education**
