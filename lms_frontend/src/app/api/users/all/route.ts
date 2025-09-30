import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

/**
 * GET all users from database (for debugging)
 * Returns teachers, students, and admins
 */
export async function GET(request: NextRequest) {
  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    
    // Get all users
    const allUsers = await usersCollection.find({}).toArray();
    
    // Get all student profiles
    const allProfiles = await studentProfilesCollection.find({}).toArray();
    
    // Organize by role
    const teachers = allUsers.filter(u => u.role === 'teacher');
    const students = allUsers.filter(u => u.role === 'student');
    const admins = allUsers.filter(u => u.role === 'admin');
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers: allUsers.length,
          teachers: teachers.length,
          students: students.length,
          admins: admins.length,
          studentProfiles: allProfiles.length
        },
        teachers: teachers.map(t => ({
          mockUserId: t.mockUserId,
          userId: t.userId,
          name: t.name,
          email: t.email,
          schoolId: t.schoolId,
          classId: t.classId,
          status: t.status,
          createdAt: t.createdAt
        })),
        students: students.map(s => ({
          mockUserId: s.mockUserId,
          userId: s.userId,
          name: s.name,
          email: s.email,
          schoolId: s.schoolId,
          classId: s.classId,
          status: s.status,
          createdAt: s.createdAt
        })),
        admins: admins.map(a => ({
          mockUserId: a.mockUserId,
          userId: a.userId,
          name: a.name,
          email: a.email,
          schoolId: a.schoolId,
          classId: a.classId,
          status: a.status,
          createdAt: a.createdAt
        })),
        studentProfiles: allProfiles.map(p => ({
          studentMockId: p.studentMockId,
          studentName: p.studentName,
          name: p.name,
          email: p.email,
          personalityTestCompleted: p.personalityTestCompleted,
          oceanTraits: p.oceanTraits
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching all users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
