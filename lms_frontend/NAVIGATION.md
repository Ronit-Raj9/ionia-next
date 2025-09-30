# 🗺️ Project Navigation Guide

## 📍 Where Everything Is

### **🎯 START HERE:**
```
README.md              ← Master overview (read this first!)
START_HERE.md          ← Detailed entry point
```

---

## 📂 File Organization

### **📖 Documentation (8 files)**

**For First-Time Users:**
1. `README.md` - Master overview with quick start
2. `START_HERE.md` - Detailed entry point with roadmap
3. `QUICK_START.md` - 5-minute setup guide

**For Testing:**
4. `TESTING_GUIDE.md` - Comprehensive testing procedures
5. `check-system.sh` - System readiness check (script)
6. `quick-demo.sh` - 2-minute demo (script)
7. `test-api.sh` - Full API testing (script)

**For Presentations:**
8. `DEMO_SCRIPT.md` - 10-minute presentation guide

**For Understanding:**
9. `FINAL_STATUS.md` - What's complete, what's left
10. `IMPLEMENTATION_SUMMARY.md` - Technical details
11. `COMPLETION_REPORT.md` - Full project report
12. `NAVIGATION.md` - This file!

---

### **💻 Source Code**

#### **Core Logic (`src/lib/`)**
```
src/lib/
├── db.ts                      # ✅ Database schema (OCEAN, mastery, etc.)
├── groq.ts                    # ✅ AI personalization & grading
├── progress-tracker.ts        # ✅ NEW: Automatic mastery tracking
├── oceanQuizQuestions.ts      # ✅ NEW: OCEAN personality questions
├── demo-seed-data.ts          # ✅ NEW: Demo data generator
├── googleVision.ts            # ✅ OCR for handwritten answers
├── cloudinary.ts              # ✅ Image/file storage
├── gamification.ts            # ✅ Badges & achievements
├── openai.ts                  # ✅ Fallback AI provider
└── gemini-service.ts          # ⚠️  Alternative (optional)
```

**Key Files to Understand:**
- **`db.ts`**: All data structures (StudentProfile, Assignment, Submission)
- **`groq.ts`**: AI magic happens here (personalization & grading)
- **`progress-tracker.ts`**: Mastery calculation & updates
- **`demo-seed-data.ts`**: How demo students are generated

---

#### **UI Components (`src/components/`)**
```
src/components/
└── OceanPersonalityQuiz.tsx   # ✅ NEW: Beautiful personality test UI
```

**More components in:**
- `src/shared/components/` - Shared UI components
- `src/features/*/components/` - Feature-specific components

---

#### **API Endpoints (`src/app/api/`)**
```
src/app/api/
├── seed/route.ts              # ✅ POST - Seed demo data
├── student-profiles/route.ts  # ✅ GET/POST - OCEAN profiles
├── assignments/route.ts       # ✅ GET/POST - Create & personalize
├── submissions/route.ts       # ✅ POST - Submit & auto-grade
├── classes/
│   ├── route.ts               # ✅ GET/POST - Class management
│   └── join/route.ts          # ✅ POST - Student joins class
├── analytics/
│   └── advanced/route.ts      # ✅ GET - Analytics data
├── grading/route.ts           # ✅ POST - Manual grading
└── progress/route.ts          # ✅ GET - Student progress
```

**API Flow:**
```
1. POST /api/seed                    → Loads demo data
2. GET /api/student-profiles         → Gets OCEAN profile
3. GET /api/assignments              → Gets personalized assignment
4. POST /api/submissions             → Submits + auto-grades
5. GET /api/student-profiles         → Sees updated mastery
```

---

### **🧪 Testing Scripts**

```
./check-system.sh              # System readiness check
./quick-demo.sh                # 2-minute demo
./test-api.sh                  # Full API testing
```

**What each does:**
- **`check-system.sh`**: Verifies MongoDB, Node, dependencies, server
- **`quick-demo.sh`**: Shows personalization for 2 students
- **`test-api.sh`**: Tests all endpoints, shows results

---

## 🎯 Common Tasks

### **Task 1: "I want to see it work"**
```bash
./check-system.sh    # Verify ready
./quick-demo.sh      # See the magic
```
**Read:** `README.md`

---

### **Task 2: "I want to understand the system"**
```bash
# Read in this order:
1. START_HERE.md
2. FINAL_STATUS.md
3. IMPLEMENTATION_SUMMARY.md
```
**Look at:** `src/lib/db.ts`, `src/lib/groq.ts`

---

### **Task 3: "I want to test everything"**
```bash
./check-system.sh    # Pre-check
./test-api.sh        # Full test
```
**Read:** `TESTING_GUIDE.md`

---

### **Task 4: "I want to demo/present"**
```bash
./quick-demo.sh      # Practice
```
**Read:** `DEMO_SCRIPT.md`

---

### **Task 5: "I want to develop more"**
**Read:**
1. `IMPLEMENTATION_SUMMARY.md` - Architecture
2. `COMPLETION_REPORT.md` - What's left
3. Code in `src/lib/` and `src/app/api/`

**Start with:**
- `src/lib/db.ts` - Understand data structures
- `src/lib/groq.ts` - Understand AI logic
- `src/app/api/assignments/route.ts` - See personalization in action

---

## 🗺️ Feature Map

### **Where is each feature implemented?**

#### **1. OCEAN Personality Assessment**
- **Quiz Questions**: `src/lib/oceanQuizQuestions.ts`
- **Quiz UI**: `src/components/OceanPersonalityQuiz.tsx`
- **API**: `src/app/api/student-profiles/route.ts` (POST)
- **Schema**: `src/lib/db.ts` (StudentProfile.oceanTraits)

---

#### **2. AI Personalization**
- **Logic**: `src/lib/groq.ts` (`personalizeAssignmentWithOcean()`)
- **API**: `src/app/api/assignments/route.ts` (POST - creates personalized versions)
- **Schema**: `src/lib/db.ts` (Assignment.personalizedVersions)

**Flow:**
```
Teacher creates assignment 
  → API calls personalizeAssignmentWithOcean() for each student
  → Groq AI adapts based on OCEAN + mastery
  → Saves personalizedVersions to database
Student requests assignment
  → API returns their personalized version
```

---

#### **3. Auto-Grading**
- **OCR**: `src/lib/googleVision.ts` (`extractTextFromImage()`)
- **Grading Logic**: `src/lib/groq.ts` (`gradeSubmissionDetailed()`)
- **API**: `src/app/api/submissions/route.ts` (POST)
- **Schema**: `src/lib/db.ts` (Submission.autoGrade)

**Flow:**
```
Student uploads image
  → Google Vision extracts text (OCR)
  → Groq AI grades with detailed feedback
  → Saves to Submission.autoGrade
  → Triggers progress update
```

---

#### **4. Progress Tracking**
- **Logic**: `src/lib/progress-tracker.ts` (`updateStudentMastery()`)
- **API**: Called automatically after grading in `src/app/api/submissions/route.ts`
- **Schema**: `src/lib/db.ts` (StudentProfile.subjectMastery, assignmentHistory)

**Flow:**
```
After grading completes
  → Extract weaknesses from feedback
  → Calculate new mastery (weighted: 60% old, 40% new)
  → Update StudentProfile.subjectMastery
  → Check for badges
  → Update engagement metrics
```

---

#### **5. Demo Data**
- **Generator**: `src/lib/demo-seed-data.ts`
- **API**: `src/app/api/seed/route.ts` (POST)
- **Schema**: Uses all schemas in `src/lib/db.ts`

**What it creates:**
- 20 students with diverse OCEAN profiles
- 2 classes (9A Science, 10B Science)
- 2 assignments (Gravitation, Electricity)
- Pre-configured progress data

---

## 📊 Data Flow

### **Complete User Journey:**

```
1. SEED DATA
   POST /api/seed
   ↓ Creates 20 students, 2 classes, 2 assignments

2. STUDENT TAKES QUIZ (Optional - already done in seed)
   UI: OceanPersonalityQuiz component
   ↓ Calculates OCEAN traits
   POST /api/student-profiles
   ↓ Saves oceanTraits, learningPreferences

3. TEACHER CREATES ASSIGNMENT
   POST /api/assignments
   ↓ For each student:
       - Gets StudentProfile (OCEAN + mastery)
       - Calls personalizeAssignmentWithOcean()
       - Saves personalizedVersions[]

4. STUDENT VIEWS ASSIGNMENT
   GET /api/assignments?studentMockId=X
   ↓ Returns their personalized version
   ↓ Shows: difficultyAdjustment, hints, encouragementNote

5. STUDENT SUBMITS ANSWER
   POST /api/submissions (with text or image)
   ↓ If image: OCR extracts text
   ↓ AI grades with detailed feedback
   ↓ Saves Submission with autoGrade
   ↓ Triggers progress update

6. PROGRESS UPDATES (Automatic)
   updateStudentMastery() called
   ↓ Calculates new mastery score
   ↓ Extracts weaknesses from feedback
   ↓ Updates StudentProfile.subjectMastery
   ↓ Adds to assignmentHistory

7. NEXT ASSIGNMENT (Loop back to step 3)
   Uses updated mastery for better personalization
```

---

## 🔍 Finding Specific Code

### **"Where is the OCEAN scoring logic?"**
→ `src/components/OceanPersonalityQuiz.tsx` 
   (Function: `calculateOceanScores()`)

### **"Where does AI personalization happen?"**
→ `src/lib/groq.ts` 
   (Function: `personalizeAssignmentWithOcean()`)

### **"Where is the grading logic?"**
→ `src/lib/groq.ts` 
   (Function: `gradeSubmissionDetailed()`)

### **"Where does mastery get updated?"**
→ `src/lib/progress-tracker.ts` 
   (Function: `updateStudentMastery()`)

### **"Where is the demo data generated?"**
→ `src/lib/demo-seed-data.ts` 
   (Function: `generateDiverseOceanProfiles()`)

### **"Where are the database schemas?"**
→ `src/lib/db.ts` 
   (Interfaces: StudentProfile, Assignment, Submission)

---

## 🎯 Quick Reference

### **Environment Variables**
File: `.env.local`
```
MONGODB_URI=mongodb://localhost:27017/IoniaDB
GROQ_API_KEY=your_key
GOOGLE_CLOUD_PROJECT_ID=your_project
GOOGLE_CLOUD_PRIVATE_KEY=your_key
GOOGLE_CLOUD_CLIENT_EMAIL=your_email
```

### **MongoDB Collections**
- `users` - User accounts
- `classes` - Class information
- `studentProfiles` - OCEAN traits, mastery, history
- `assignments` - Questions + personalized versions
- `submissions` - Student answers + auto-grades
- `progress` - Progress tracking (legacy)
- `analytics` - Class-wide analytics (future)

### **API Endpoints**
```
POST   /api/seed                 # Seed demo data
GET    /api/student-profiles     # Get OCEAN profile
POST   /api/student-profiles     # Update profile
GET    /api/classes              # Get classes
GET    /api/assignments          # Get (personalized) assignments
POST   /api/assignments          # Create assignment
POST   /api/submissions          # Submit & auto-grade
GET    /api/submissions          # Get submissions
```

---

## 🎓 Learning Path

### **For Beginners:**
1. Read `README.md`
2. Run `./quick-demo.sh`
3. Read `START_HERE.md`
4. Run `./test-api.sh`

### **For Developers:**
1. Read `IMPLEMENTATION_SUMMARY.md`
2. Explore `src/lib/db.ts`
3. Read `src/lib/groq.ts`
4. Explore `src/app/api/*/route.ts`

### **For Presenters:**
1. Read `DEMO_SCRIPT.md`
2. Practice with `./quick-demo.sh`
3. Run `./test-api.sh` before demo
4. Keep `START_HERE.md` as backup

---

## 🗂️ File Count Summary

```
Documentation:  12 files
Source Code:    16 files (key files)
Test Scripts:   3 files
Total:          ~31 key files

Lines of Code:  ~5,000 lines
Documentation:  ~2,500 lines
Total:          ~7,500 lines
```

---

## ✅ Navigation Checklist

**To get started:**
- [ ] Read `README.md` (5 min)
- [ ] Read `START_HERE.md` (10 min)
- [ ] Run `./check-system.sh`
- [ ] Run `./quick-demo.sh`

**To understand deeply:**
- [ ] Read `FINAL_STATUS.md`
- [ ] Read `IMPLEMENTATION_SUMMARY.md`
- [ ] Explore `src/lib/db.ts`
- [ ] Explore `src/lib/groq.ts`

**To demo:**
- [ ] Read `DEMO_SCRIPT.md`
- [ ] Practice with `./quick-demo.sh`
- [ ] Run `./test-api.sh`
- [ ] Prepare Q&A

---

## 🎉 You're Ready!

**Current location:** You're in `lms_frontend/`

**Quick actions:**
```bash
./check-system.sh    # Am I ready?
./quick-demo.sh      # Show me the magic!
./test-api.sh        # Test everything
```

**Next steps:**
- Open `README.md` for master overview
- Open `START_HERE.md` for detailed guide
- Or just run `./quick-demo.sh` to see it work!

**🚀 Happy exploring!**

