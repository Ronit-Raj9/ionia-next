# Role-Based Access Control (RBAC) System Documentation

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented in the IONIA LMS application. The system supports four distinct roles with hierarchical permissions and automatic credential generation.

---

## Table of Contents

1. [Role Hierarchy](#role-hierarchy)
2. [System Architecture](#system-architecture)
3. [Account Creation Flow](#account-creation-flow)
4. [API Endpoints](#api-endpoints)
5. [Permission System](#permission-system)
6. [Usage Guide](#usage-guide)
7. [Security Considerations](#security-considerations)

---

## Role Hierarchy

### 1. Superadmin
**Highest Level Authority**

**Permissions:**
- ✅ Create schools and assign admins
- ✅ Access all schools, admins, teachers, and students
- ✅ Create admin, teacher, and student accounts for any school
- ✅ View, modify, and delete any data system-wide
- ✅ Manage classes across all schools
- ✅ Generate system-wide reports and analytics

**Restrictions:**
- None (full system access)

**Use Cases:**
- System administrators
- Platform owners
- Technical support team

---

### 2. Admin
**School-Level Authority**

**Permissions:**
- ✅ Manage their assigned school only
- ✅ Create additional admins for their school
- ✅ Create teachers for their school
- ✅ Register students for their school
- ✅ Manage classes within their school
- ✅ View and modify teacher/student profiles in their school
- ✅ Generate school-level reports

**Restrictions:**
- ❌ Cannot access other schools
- ❌ Cannot create or modify superadmin accounts
- ❌ Cannot access system-wide settings

**Assignment:**
- Assigned by Superadmin when creating a school
- Can be created by other admins within the same school

---

### 3. Teacher
**Classroom-Level Authority**

**Permissions:**
- ✅ Create and manage their own classes
- ✅ Add students to their classes (manually or via join code)
- ✅ Generate class joining codes for students
- ✅ Assign tests and assignments
- ✅ Grade student submissions
- ✅ View student progress in their classes
- ✅ Access full IONIA LMS features for their classes

**Restrictions:**
- ❌ Cannot create other teachers, admins, or students
- ❌ Cannot access classes of other teachers
- ❌ Cannot modify school-level settings
- ❌ Scoped to their assigned school only

**Assignment:**
- Created by Superadmin or Admin
- Receives auto-generated User ID and Password

---

### 4. Student
**Learner Role**

**Permissions:**
- ✅ Join classes using joining codes
- ✅ View and complete assignments
- ✅ Submit answers and receive feedback
- ✅ Track personal progress
- ✅ Communicate with teachers

**Restrictions:**
- ❌ Cannot create or manage accounts
- ❌ Cannot create classes
- ❌ Cannot view other students' data
- ❌ Scoped to their assigned school and classes

**Assignment:**
- Created by Superadmin or Admin
- Receives auto-generated User ID and Password

---

## System Architecture

### Database Schema

```typescript
interface User {
  _id?: ObjectId;
  role: 'superadmin' | 'admin' | 'teacher' | 'student';
  userId: string;              // Auto-generated unique ID
  password: string;            // Hashed password
  name: string;
  email: string;
  schoolId?: ObjectId;         // Required for admin, teacher, student
  classId?: string;            // Required for students
  permissions?: {
    canCreateSchools?: boolean;
    canManageAllSchools?: boolean;
    canCreateAdmins?: boolean;
    canCreateTeachers?: boolean;
    canCreateStudents?: boolean;
    canManageClasses?: boolean;
    canViewAllData?: boolean;
    scopedToSchool?: ObjectId;
  };
  status?: 'active' | 'inactive' | 'suspended';
  createdBy?: ObjectId;        // Reference to creator
  createdAt: Date;
  updatedAt?: Date;
}
```

### User ID Format

**Pattern:** `ROLE-YYYYMMDD-RANDOM`

**Examples:**
- `SUPERADMIN-20250101-A1B2C3`
- `ADMIN-20250101-D4E5F6`
- `TEACHER-20250101-G7H8I9`
- `STUDENT-20250101-J0K1L2`

### Password Format

**Pattern:** 8 characters with:
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@#$%&*)

**Example:** `Xk9@mP2q`

---

## Account Creation Flow

### 1. Creating a School (Superadmin Only)

```typescript
// POST /api/schools/create
{
  "creatorUserId": "superadmin_id",
  "creatorRole": "superadmin",
  "schoolName": "Delhi Public School",
  "schoolType": "CBSE",
  "address": {
    "street": "123 Main Street",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  },
  "contact": {
    "email": "school@dps.edu",
    "phone": "+91 9876543210"
  },
  "adminName": "John Doe",
  "adminEmail": "admin@dps.edu",
  "adminPhone": "+91 9876543211"
}

// Response includes:
{
  "school": {
    "_id": "...",
    "schoolId": "SCHOOL-DELHI-20250101-A1B2",
    "studentJoinCode": "ABC123"
  },
  "adminCredentials": {
    "userId": "ADMIN-20250101-D4E5F6",
    "password": "Xk9@mP2q",  // Show ONCE
    "email": "admin@dps.edu"
  }
}
```

**Process:**
1. Superadmin submits school creation form
2. System generates:
   - School ID (based on city)
   - Admin User ID
   - Admin Password
   - Student Join Code
3. Admin account is created and linked to school
4. Credentials are displayed **once** (must be saved)
5. School is ready for operation

---

### 2. Creating Users (Superadmin or Admin)

```typescript
// POST /api/users/create
{
  "creatorUserId": "creator_id",
  "creatorRole": "superadmin" | "admin",
  "creatorSchoolId": "school_id",  // For admin creators
  "targetRole": "admin" | "teacher" | "student",
  "targetSchoolId": "school_id",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phoneNumber": "+91 9876543212"
}

// Response:
{
  "success": true,
  "data": {
    "credentials": {
      "userId": "TEACHER-20250101-G7H8I9",
      "password": "Ab3#Xy9z",  // Show ONCE
      "email": "jane@example.com"
    },
    "user": {
      "_id": "...",
      "role": "teacher",
      "name": "Jane Smith",
      "schoolId": "school_id"
    }
  }
}
```

**Permission Validation:**
- Superadmin can create users for any school
- Admin can only create users for their own school
- Teachers cannot create any users

---

## API Endpoints

### Authentication

#### Login
```
POST /api/auth/login

Body (New System):
{
  "userId": "TEACHER-20250101-G7H8I9",
  "password": "Ab3#Xy9z"
}

Body (Legacy - Email only):
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "user": {
    ...user data
  }
}
```

### School Management

#### Create School
```
POST /api/schools/create
[Superadmin only]

Body: {school details + admin details}
Response: {school + admin credentials}
```

#### Get Schools
```
GET /api/schools/create?role=superadmin

Response: {schools: [...]}
```

### User Management

#### Create User
```
POST /api/users/create
[Superadmin or Admin]

Body: {role, schoolId, name, email, ...}
Response: {credentials, user}
```

#### Get Users
```
GET /api/users/create?role=superadmin&targetRole=teacher

Response: {users: [...]}
```

---

## Permission System

### Permission Checker Functions

Available in `@/contexts/RoleContext`:

```typescript
import { hasPermission } from '@/contexts/RoleContext';

// Usage:
if (hasPermission.canCreateSchools(user)) {
  // Show school creation UI
}

if (hasPermission.canAccessSchool(user, schoolId)) {
  // Show school data
}
```

### Permission Functions:

- `canCreateSchools(user)` - Superadmin only
- `canManageAllSchools(user)` - Superadmin only
- `canCreateAdmins(user)` - Superadmin or Admin
- `canCreateTeachers(user)` - Superadmin or Admin
- `canCreateStudents(user)` - Superadmin or Admin
- `canManageClasses(user)` - Superadmin, Admin, or Teacher
- `canViewAllData(user)` - Superadmin only
- `isScopedToSchool(user)` - Admin or Teacher
- `canAccessSchool(user, schoolId)` - Check school access

### Validation Utilities

```typescript
import { validatePermission } from '@/lib/authUtils';

const result = validatePermission(
  userRole,
  'createTeacher',
  targetSchoolId,
  userSchoolId
);

if (!result.allowed) {
  return { error: result.reason };
}
```

---

## Usage Guide

### For Superadmins

**Dashboard:** `/superadmin`

**Typical Workflow:**
1. Navigate to "Create School" tab
2. Fill in school details and admin information
3. Submit form
4. **Important:** Save the generated admin credentials immediately
5. Send credentials to admin via secure channel
6. Monitor all schools from "All Schools" tab
7. Create additional users from "Create User" tab

**Best Practices:**
- Save credentials in secure password manager
- Send credentials via encrypted email or secure messaging
- Verify admin has received and can login
- Monitor new school registration progress

---

### For Admins

**Dashboard:** `/admin`

**Typical Workflow:**
1. Login with provided User ID and Password
2. Create teacher accounts for your school
3. Save teacher credentials securely
4. Distribute credentials to teachers
5. Create student accounts or enable student self-registration
6. Manage classes and monitor school progress

**Best Practices:**
- Keep a secure record of all created accounts
- Use school's email domain for consistency
- Create teachers before classes
- Verify teacher accounts before assigning classes

---

### For Teachers

**Dashboard:** `/teacher`

**Typical Workflow:**
1. Login with provided User ID and Password
2. Create classroom
3. Generate joining code for classroom
4. Share joining code with students
5. Create assignments for students
6. Grade submissions and provide feedback
7. Monitor student progress

**Limitations:**
- Cannot create other teacher accounts
- Cannot access other teachers' classes
- Cannot modify school settings

---

### For Students

**Dashboard:** `/student`

**Typical Workflow:**
1. Login with provided User ID and Password
2. Use joining code to join classroom
3. Complete personality assessment quiz
4. View and complete assignments
5. Track progress and achievements

---

## Security Considerations

### Password Security

✅ **Implemented:**
- Passwords are hashed using PBKDF2 with salt
- Passwords contain uppercase, lowercase, numbers, and special characters
- Passwords are only shown once during creation
- Passwords are never stored in plain text
- Passwords are never returned in API responses (except during creation)

### Access Control

✅ **Implemented:**
- Role-based permissions checked on every API call
- School-scoped data access for admins and teachers
- Cross-school access blocked at API level
- User validation before any data modification

### Data Privacy

✅ **Implemented:**
- Teachers can only see students in their classes
- Admins can only see data from their school
- Students can only see their own data
- Superadmins have full visibility (for support)

### Audit Trail

✅ **Implemented:**
- `createdBy` field tracks who created each account
- `createdAt` and `updatedAt` timestamps
- `lastLogin` tracking
- Status field for account management

---

## Common Scenarios

### Scenario 1: New School Onboarding

1. **Superadmin** creates school with initial admin
2. **Superadmin** saves and sends admin credentials
3. **Admin** logs in and creates 5 teachers
4. **Admin** sends teacher credentials to each teacher
5. **Teachers** log in and create their classrooms
6. **Teachers** generate and share joining codes
7. **Students** use codes to join classes

### Scenario 2: Adding a Teacher Mid-Year

1. **Admin** logs into admin dashboard
2. **Admin** goes to "Create User" → "Teacher"
3. **Admin** fills in teacher details
4. **Admin** saves generated credentials
5. **Admin** sends credentials to new teacher
6. **Teacher** logs in and sets up classes
7. **Admin** monitors teacher activity

### Scenario 3: Student Transfer

1. **Admin** logs into admin dashboard
2. **Admin** creates student account for new student
3. **Admin** assigns student to class or provides join code
4. **Student** logs in with provided credentials
5. **Student** joins classes and starts learning

---

## Troubleshooting

### Common Issues

**Issue:** Admin can't create teachers
**Solution:** Verify admin's `schoolId` matches target school

**Issue:** Teacher can't see students
**Solution:** Verify students are enrolled in teacher's classes

**Issue:** Credentials lost
**Solution:** Only shown once; must be regenerated by creating new account

**Issue:** Login fails with correct credentials
**Solution:** Check account status (active/inactive/suspended)

---

## Technical Implementation

### File Structure

```
lms_frontend/
├── src/
│   ├── lib/
│   │   ├── authUtils.ts          # ID/password generation & validation
│   │   └── db.ts                  # Updated User interface
│   ├── contexts/
│   │   └── RoleContext.tsx        # Permission checker hooks
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/login/        # Authentication endpoint
│   │   │   ├── users/create/      # User creation endpoint
│   │   │   └── schools/create/    # School creation endpoint
│   │   ├── superadmin/
│   │   │   └── page.tsx           # Superadmin dashboard
│   │   ├── admin/
│   │   │   └── page.tsx           # Admin dashboard (to be updated)
│   │   └── teacher/
│   │       └── page.tsx           # Teacher dashboard (to be updated)
```

### Key Functions

1. **ID Generation:** `generateUserId(role)`
2. **Password Generation:** `generatePassword()`
3. **Password Hashing:** `hashPassword(password)`
4. **Password Verification:** `verifyPassword(password, hash)`
5. **Permission Validation:** `validatePermission(role, action, ...)`
6. **Default Permissions:** `getDefaultPermissions(role, schoolId)`

---

## Future Enhancements

### Planned Features:
- [ ] Password reset flow
- [ ] Email verification on account creation
- [ ] Multi-factor authentication (MFA)
- [ ] Temporary password expiration
- [ ] Bulk user import via CSV
- [ ] Role delegation (temporary permissions)
- [ ] Audit log viewer for admins
- [ ] Account recovery process

---

## Support

For technical support or questions about the RBAC system:
- Review this documentation
- Check API endpoint responses for error messages
- Verify user permissions using `hasPermission` functions
- Contact system administrator for account issues

---

**Last Updated:** 2025-01-31
**Version:** 1.0
**Author:** IONIA LMS Development Team

