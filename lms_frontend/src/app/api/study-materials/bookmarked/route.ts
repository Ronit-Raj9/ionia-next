import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { connectToDatabase, COLLECTIONS } from '@/lib/db';

// GET - Get all bookmarked study materials for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Student access required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);

    // Get all published materials bookmarked by this student
    const materials = await studyMaterialsCollection
      .find({
        status: 'published',
        isActive: true,
        bookmarkedBy: { $in: [session.userId] },
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Add bookmark status
    const materialsWithBookmark = materials.map((material: any) => ({
      ...material,
      isBookmarked: true,
    }));

    return NextResponse.json({
      success: true,
      data: materialsWithBookmark,
    });
  } catch (error) {
    console.error('Error fetching bookmarked materials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookmarked materials' },
      { status: 500 }
    );
  }
}

