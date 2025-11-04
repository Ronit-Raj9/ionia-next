import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { connectToDatabase, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';

// POST - Publish a draft study material
export async function POST(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Teacher access required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);

    // Verify material exists and belongs to teacher
    const material = await studyMaterialsCollection.findOne({
      _id: new ObjectId(params.materialId),
      teacherId: session.userId,
      isActive: true,
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'Study material not found or access denied' },
        { status: 404 }
      );
    }

    if (material.status === 'published') {
      return NextResponse.json(
        { success: false, error: 'Material is already published' },
        { status: 400 }
      );
    }

    // Publish the material
    await studyMaterialsCollection.updateOne(
      { _id: new ObjectId(params.materialId) },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Study material published and broadcast to class',
    });
  } catch (error) {
    console.error('Error publishing study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish study material' },
      { status: 500 }
    );
  }
}

