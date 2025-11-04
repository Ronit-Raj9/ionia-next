import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { connectToDatabase, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';

// POST - Toggle bookmark for a study material (students only)
export async function POST(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
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

    // Verify material exists and is published
    const material = await studyMaterialsCollection.findOne({
      _id: new ObjectId(params.materialId),
      status: 'published',
      isActive: true,
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'Study material not found' },
        { status: 404 }
      );
    }

    const bookmarkedBy = material.bookmarkedBy || [];
    const isBookmarked = bookmarkedBy.includes(session.userId);

    // Toggle bookmark
    if (isBookmarked) {
      // Remove bookmark
      await studyMaterialsCollection.updateOne(
        { _id: new ObjectId(params.materialId) },
        {
          $pull: { bookmarkedBy: session.userId } as any,
          $set: { updatedAt: new Date() },
        }
      );
      return NextResponse.json({
        success: true,
        isBookmarked: false,
        message: 'Bookmark removed',
      });
    } else {
      // Add bookmark
      await studyMaterialsCollection.updateOne(
        { _id: new ObjectId(params.materialId) },
        {
          $addToSet: { bookmarkedBy: session.userId },
          $set: { updatedAt: new Date() },
        }
      );
      return NextResponse.json({
        success: true,
        isBookmarked: true,
        message: 'Bookmarked successfully',
      });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle bookmark' },
      { status: 500 }
    );
  }
}

