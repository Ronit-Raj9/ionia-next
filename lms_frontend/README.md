# 🎓 IONIA LMS - Learning Management System

## 🚀 **Production-Ready Enterprise LMS**

A complete Learning Management System with AI-powered features, secure authentication, and comprehensive role-based access control.

---

## ✨ **Key Features**

### **🔐 Security**
- HTTP-only cookie sessions (XSS protected)
- Email + Password authentication
- PBKDF2 password hashing
- Role-based access control (RBAC)
- School-scoped data isolation
- No exposed API keys

### **👥 User Management**
- **4 Roles:** Superadmin, Admin, Teacher, Student
- Auto-generated credentials
- Bulk student creation
- Paste import (pipe-separated format)
- Profile settings with password change

### **🏫 School Management**
- Multi-school support
- School-scoped permissions
- Admin assignment per school
- Teacher and student management
- Class organization

### **🤖 AI-Powered Features**
- Personalized learning paths
- Auto-grading with AI
- OCEAN personality profiling
- Adaptive question delivery
- Student progress tracking

---

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Configure Environment**

Create `.env.local` file:

```bash
# Database (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/IoniaDB

# Session Security (REQUIRED)
# Generate: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# AI Services (Optional)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=sk-your-openai-key
GROQ_API_KEY=your-groq-key

# File Upload (Optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_SECRET=your_secret
```

### **3. Start Development Server**
```bash
npm run dev
```

### **4. Login**
```
Go to: http://localhost:3001/login
Email: superadmin@ionia.edu
Password: (use your saved credentials)
```

---

## 🎯 **User Roles**

### **Superadmin**
- Create schools with admins
- Manage all schools and users
- Access everything system-wide
- **Dashboard:** `/superadmin`

### **Admin**
- Manage their school only
- Create teachers, students, admins
- Bulk student creation
- School-level analytics
- **Dashboard:** `/admin`

### **Teacher**
- Create and manage classes
- Create assignments
- Grade submissions
- View student progress
- **Dashboard:** `/teacher`

### **Student**
- Join classes with codes
- Complete assignments
- View progress
- Chat with teachers
- **Dashboard:** `/student`

---

## 📋 **Account Creation**

### **Create School (Superadmin):**
1. Login as superadmin
2. Go to "Create School" tab
3. Fill school and admin details
4. Submit → Admin credentials generated
5. **Save credentials immediately!**

### **Create Users (Admin):**
1. Login as admin
2. Go to "User Management" tab
3. Choose: Teacher / Student / Bulk Students / Admin
4. Fill details or paste import
5. Submit → Credentials generated
6. **Save and share credentials!**

### **Bulk Student Creation:**
1. Click "Bulk Students" tab
2. Choose: Manual Entry or Paste Import
3. **Paste Import Format:**
   ```
   Name | Email | Class | Section
   ```
4. Create all → Get credentials in same format
5. Download CSV or copy pipe format

---

## 🔒 **Login System**

### **All Roles Login With:**
```
Email:    user@example.com
Password: Auto-generated or changed password
```

### **Features:**
- Email + Password required
- Show/hide password toggle
- Account status validation
- Role-based redirect
- Secure HTTP-only cookies

---

## 👤 **Profile & Settings**

All users can access `/profile`:

### **Account Information:**
- View name, email, role
- View User ID, school
- View phone number

### **Change Password:**
- Enter current password
- Set new password (8+ chars, complex)
- Real-time strength indicator
- Requirements checklist
- Auto-logout after change

---

## 🔐 **Security Features**

### **Authentication:**
- ✅ Email + Password required
- ✅ PBKDF2 password hashing
- ✅ HTTP-only cookie sessions
- ✅ JWT with 24-hour expiration
- ✅ XSS attack protection
- ✅ CSRF protection (SameSite)

### **Authorization:**
- ✅ Role-based permissions
- ✅ School-scoped data access
- ✅ Session validation on every request
- ✅ No API keys in client code
- ✅ Secure credential generation

### **Data Protection:**
- ✅ Passwords never stored plain text
- ✅ No sensitive data in localStorage
- ✅ Session tokens in HTTP-only cookies
- ✅ Auto-expiring sessions
- ✅ Proper logout with cookie clearing

---

## 📚 **Documentation**

### **Essential Guides:**

1. **START_HERE.md**
   - Entry point for new developers
   - Quick overview of the system
   - What to read next

2. **RBAC_SYSTEM_DOCUMENTATION.md**
   - Complete RBAC system reference
   - All roles and permissions
   - API endpoints documentation
   - Usage examples

3. **SECURITY_SETUP_INSTRUCTIONS.md**
   - Environment setup
   - JWT_SECRET configuration
   - Security best practices
   - Verification steps

---

## 🛠️ **Available Scripts**

```bash
# Development
npm run dev              # Start dev server (port 3001)

# Production
npm run build           # Build for production
npm run start           # Start production server

# Utilities
npm run lint            # Run ESLint
```

---

## 🏗️ **Tech Stack**

### **Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (state)

### **Backend:**
- MongoDB (database)
- JWT sessions (jose)
- Node.js crypto (password hashing)

### **AI Services:**
- Google Gemini (OCR, personalization)
- OpenAI GPT-4 (grading)
- Groq (fast inference)

### **File Storage:**
- Cloudinary

---

## 📊 **Database Schema**

### **Collections:**
- `users` - All user accounts (superadmin, admin, teacher, student)
- `schools` - School information
- `classes` - Classroom data
- `assignments` - Assignment metadata
- `submissions` - Student submissions
- `studentProfiles` - OCEAN personality traits
- `studentLearningProfiles` - Adaptive learning metrics
- `progress` - Student progress tracking
- `analytics` - Class analytics
- `academicPlans` - Curriculum planning

**See:** `src/lib/db.ts` for complete schema definitions

---

## 🔄 **Typical Workflow**

### **School Onboarding:**
```
1. Superadmin creates school
   ↓
2. Admin receives credentials
   ↓
3. Admin creates teachers (bulk or single)
   ↓
4. Admin creates students (bulk paste import)
   ↓
5. Teachers create classes
   ↓
6. Students join with codes
   ↓
7. Teaching & learning begins!
```

---

## 🎯 **API Security**

All API routes now require:
- ✅ Valid session (HTTP-only cookie)
- ✅ Role-based permissions
- ✅ School-scoped access (non-superadmins)
- ✅ Input validation
- ✅ Error handling

**Example protected route:**
```typescript
export async function GET(request: NextRequest) {
  // Validate session
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Check permissions
  if (!['admin', 'teacher'].includes(session.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  
  // Enforce school scoping
  if (session.role !== 'superadmin') {
    query.schoolId = session.schoolId;
  }
  
  // Process request...
}
```

---

## 🚨 **Important Notes**

### **First Time Setup:**
1. Configure `.env.local` with all required variables
2. Login with your superadmin credentials (already created)
3. Create your first school
4. Start onboarding users

### **Security Requirements:**
- JWT_SECRET must be set (minimum 32 characters)
- MONGODB_URI must point to your database
- Never commit `.env.local` to git
- Use different secrets for dev/staging/production
- Rotate JWT_SECRET every 90 days

### **User Credentials:**
- Auto-generated on account creation
- Format: Email + 8-char complex password
- Shown only once (must be saved!)
- Users can change password via /profile
- Cannot recover lost credentials (create new account)

---

## 📞 **Support**

### **Documentation:**
- **Quick Start:** START_HERE.md
- **Complete Reference:** RBAC_SYSTEM_DOCUMENTATION.md
- **Security Setup:** SECURITY_SETUP_INSTRUCTIONS.md

### **Common Issues:**

**Can't login?**
- Check email and password are correct
- Verify account exists in database
- Check account status is "active"

**Session not persisting?**
- Check JWT_SECRET is set in .env.local
- Verify cookies are enabled in browser
- Check server logs for errors

**Can't create users?**
- Verify you're logged in as admin/superadmin
- Check session is valid
- Verify school ID is correct

---

## 🎊 **Features Summary**

```
AUTHENTICATION:
✅ Email + Password login
✅ HTTP-only cookie sessions
✅ Password hashing (PBKDF2)
✅ Auto-logout after 24h
✅ Password change feature

USER MANAGEMENT:
✅ 4-tier role system
✅ Auto-generated credentials
✅ Bulk student creation
✅ Paste import/export
✅ School-scoped access

EDUCATION:
✅ AI-powered personalization
✅ Automatic grading
✅ Progress tracking
✅ Adaptive learning
✅ Class management

SECURITY:
✅ XSS protection
✅ CSRF protection
✅ No exposed API keys
✅ Session validation
✅ Permission enforcement
```

---

## 📈 **Production Deployment**

### **Pre-Deployment Checklist:**
- [ ] Generate strong JWT_SECRET (64+ chars)
- [ ] Configure production MongoDB URI
- [ ] Set NODE_ENV=production
- [ ] Configure all API keys
- [ ] Enable HTTPS
- [ ] Test all features
- [ ] Create superadmin account
- [ ] Backup database
- [ ] Monitor error logs

### **Build Commands:**
```bash
npm run build
npm run start
```

---

## 🎯 **System Status**

```
Security:         🟢 Enterprise Grade A+
Authentication:   ✅ Email + Password + Sessions
RBAC:            ✅ 4 Roles Fully Implemented
Features:        ✅ All Working
Documentation:   ✅ Complete
Production:      ✅ Ready to Deploy
```

---

## 📄 **License**

© 2025 IONIA LMS. All rights reserved.

---

## 👥 **Contributing**

For questions or contributions, refer to the documentation files in the project root.

---

**Built with ❤️ for modern education**

**Version:** 1.0.0  
**Last Updated:** 2025-01-31  
**Status:** ✅ Production Ready

