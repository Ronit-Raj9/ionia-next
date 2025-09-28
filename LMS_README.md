# Learning Management System (LMS)

A comprehensive Learning Management System built with intelligent question chaining capabilities, designed to enhance the learning experience through adaptive question sequencing.

## 🎯 Overview

The LMS is a separate application that shares the same database as the main Ionia platform, providing:

- **Intelligent Question Chaining**: Automatic question sequencing based on student performance and learning patterns
- **Adaptive Learning**: Questions adapt to student's pace and focus on weak areas
- **Role-based Access**: Separate user management for students, instructors, and admins
- **Comprehensive Analytics**: Detailed progress tracking and performance insights
- **Modern UI/UX**: Same design system and color palette as the main Ionia platform

## 🏗️ Architecture

### Backend (`lms_backend/`)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB (shared with main Ionia backend)
- **Authentication**: JWT-based with refresh tokens
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Port**: 5000 (configurable)

### Frontend (`lms_frontend/`)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom LMS theme
- **State Management**: Zustand with persistence
- **UI Components**: Radix UI + custom components
- **Port**: 3001 (configurable)

## 🚀 Key Features

### 1. Intelligent Question Chaining
- **Automatic Sequencing**: System suggests related questions based on category (theoretical, numerical, diagrammatic, critical thinking)
- **Adaptive Flow**: Questions adapt based on student performance and learning patterns
- **Syllabus Coverage**: Ensures comprehensive coverage while maintaining student interest

### 2. Admin Panel
- **Drag-and-Drop Interface**: Visual question chain builder (similar to n8n)
- **Question Search**: Advanced search with detailed question metadata display
- **Chain Management**: Create, edit, and manage question chains
- **Analytics Dashboard**: Monitor student progress and system performance

### 3. Student Experience
- **Personalized Dashboard**: Progress tracking and learning recommendations
- **Adaptive Learning Paths**: Questions automatically adjust to student's level
- **Real-time Progress**: Live tracking of learning progress and achievements
- **Gamification**: Streaks, badges, and achievement system

### 4. Analytics & Reporting
- **Student Progress**: Detailed analytics on learning patterns and performance
- **Question Analytics**: Performance metrics for individual questions
- **System Analytics**: Overall platform usage and effectiveness metrics

## 📁 Project Structure

```
lms_backend/
├── src/
│   ├── app.js              # Main Express application
│   ├── index.js            # Server entry point
│   ├── constants.js        # Application constants
│   ├── controllers/        # Business logic controllers
│   ├── models/             # MongoDB models
│   │   ├── lmsUser.model.js
│   │   ├── questionChain.model.js
│   │   └── studentProgress.model.js
│   ├── routes/             # API route definitions
│   ├── middlewares/        # Custom middleware
│   └── utils/              # Utility functions

lms_frontend/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # User dashboard
│   │   └── admin/          # Admin panel
│   ├── features/           # Feature-based modules
│   ├── shared/             # Shared components
│   ├── stores/             # Zustand state stores
│   └── providers/          # React context providers
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- MongoDB (shared with main Ionia backend)
- npm or yarn

### Backend Setup
```bash
cd lms_backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Frontend Setup
```bash
cd lms_frontend
npm install
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_ATLAS=mongodb+srv://username:password@cluster.mongodb.net/ionia
ACCESS_TOKEN_SECRET=your-access-token-secret-32-chars-minimum
REFRESH_TOKEN_SECRET=your-refresh-token-secret-32-chars-minimum
JWT_SECRET=your-jwt-secret-32-chars-minimum
LMS_FRONTEND_URL=http://localhost:3001
COOKIE_DOMAIN=localhost
HTTPS_ENABLED=false
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_LMS_API_URL=http://localhost:5000
NEXT_PUBLIC_IONIA_API_URL=http://localhost:4000
```

## 🔧 Development

### Available Scripts

#### Backend
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm run lint` - Run ESLint

#### Frontend
- `npm run dev` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info

#### Question Management
- `GET /api/v1/questions` - Get all questions
- `GET /api/v1/questions/search` - Search questions
- `GET /api/v1/questions/:id` - Get question by ID

#### Question Chains
- `GET /api/v1/chains` - Get all question chains
- `POST /api/v1/chains` - Create question chain (admin)
- `GET /api/v1/chains/:id` - Get chain by ID
- `PUT /api/v1/chains/:id` - Update chain (admin)

#### Progress Tracking
- `GET /api/v1/progress` - Get student progress
- `POST /api/v1/progress/start` - Start learning session
- `POST /api/v1/progress/answer` - Submit answer

## 🎨 Design System

The LMS uses the same design system as the main Ionia platform:

- **Primary Colors**: Emerald (500-600) and Teal (500-600)
- **Typography**: Inter font family
- **Components**: Custom components with Tailwind CSS
- **Icons**: Lucide React icons
- **Animations**: Framer Motion for smooth transitions

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Rate limiting on sensitive endpoints
- Input sanitization and validation
- CORS configuration
- Security headers with Helmet
- Password hashing with bcrypt

## 📊 Database Models

### LMSUser
- User authentication and profile information
- Learning progress and statistics
- Role-based permissions (admin, student, instructor)

### QuestionChain
- Question chain configuration and flow
- Branching rules and conditions
- Analytics and performance metrics

### StudentProgress
- Individual learning session tracking
- Question attempt history
- Performance analytics and patterns

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Basic authentication system
- ✅ User registration and login
- ✅ Basic dashboard
- ✅ Project structure setup

### Phase 2 (Next)
- 🔄 Admin panel with drag-and-drop interface
- 🔄 Question search and management
- 🔄 Question chain creation and editing

### Phase 3 (Future)
- 📋 Student learning interface
- 📋 Real-time progress tracking
- 📋 Advanced analytics and reporting
- 📋 Mobile responsiveness optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is part of the Ionia educational platform and follows the same licensing terms.

## 🆘 Support

For support and questions:
- Email: support@lms.ionia.sbs
- Documentation: [Link to documentation]
- Issues: [GitHub Issues]

---

**Note**: This LMS is designed to work alongside the main Ionia platform, sharing the same database and question bank while providing enhanced learning management capabilities.
