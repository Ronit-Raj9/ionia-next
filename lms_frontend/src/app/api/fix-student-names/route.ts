import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// POST - Fix student names in profiles
export async function POST(request: NextRequest) {
  try {
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    // Get all student profiles without names
    const profilesWithoutNames = await studentProfilesCollection
      .find({
        $or: [
          { studentName: { $exists: false } },
          { studentName: null },
          { studentName: '' }
        ]
      })
      .toArray();

    let updated = 0;
    
    for (const profile of profilesWithoutNames) {
      // Try to get name from user collection
      const user = await usersCollection.findOne({ userId: profile.studentId });
      
      let name = '';
      let email = '';
      
      if (user && user.name) {
        name = user.name;
        email = user.email || `${profile.studentId}@student.com`;
      } else if (user && user.displayName) {
        name = user.displayName;
        email = user.email || `${profile.studentId}@student.com`;
      } else {
        // Generate from studentId
        const parts = profile.studentId.split('_');
        if (parts.length >= 2) {
          name = parts.slice(1).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          email = `${profile.studentId}@student.com`;
        }
      }
      
      if (name) {
        await studentProfilesCollection.updateOne(
          { _id: profile._id },
          { 
            $set: { 
              studentName: name,
              name: name,
              email: email,
              updatedAt: new Date()
            }
          }
        );
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} student profiles with names`,
      data: {
        total: profilesWithoutNames.length,
        updated
      }
    });
  } catch (error) {
    console.error('Error fixing student names:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix student names' },
      { status: 500 }
    );
  }
}
