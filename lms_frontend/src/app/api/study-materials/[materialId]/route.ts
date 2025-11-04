import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { connectToDatabase, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { uploadFile, deleteFile, extractPublicId } from '@/lib/cloudinary';

// GET - Get single study material
export async function GET(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);

    const material = await studyMaterialsCollection.findOne({
      _id: new ObjectId(params.materialId),
      isActive: true,
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'Study material not found' },
        { status: 404 }
      );
    }

    // Students can only see published materials
    if (session.role === 'student' && material.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Teachers can only see their own materials
    if (session.role === 'teacher' && material.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Add bookmark status for students
    if (session.role === 'student') {
      material.isBookmarked = material.bookmarkedBy?.includes(session.userId) || false;
    }

    return NextResponse.json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error('Error fetching study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study material' },
      { status: 500 }
    );
  }
}

// PUT - Update study material
export async function PUT(
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

    const body = await request.json();
    const { title, description, folderId, status, linkedAssignmentId } = body;

    const { db } = await connectToDatabase();
    const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);
    const foldersCollection = db.collection(COLLECTIONS.STUDY_MATERIAL_FOLDERS);

    // Verify material exists and belongs to teacher
    const existingMaterial = await studyMaterialsCollection.findOne({
      _id: new ObjectId(params.materialId),
      teacherId: session.userId,
      isActive: true,
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { success: false, error: 'Study material not found or access denied' },
        { status: 404 }
      );
    }

    // Get folder name if folderId provided
    let folderName: string | undefined;
    if (folderId) {
      const folder = await foldersCollection.findOne({
        _id: new ObjectId(folderId),
        classId: existingMaterial.classId,
        teacherId: session.userId,
      });
      if (folder) {
        folderName = folder.folderName;
      }
    }

    // Build update object
    const update: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (folderId !== undefined) {
      update.folderId = folderId ? new ObjectId(folderId) : null;
      update.folderName = folderName;
    }
    if (status !== undefined) {
      update.status = status;
      if (status === 'published' && existingMaterial.status === 'draft') {
        update.publishedAt = new Date();
      }
    }
    if (linkedAssignmentId !== undefined) {
      update.linkedAssignmentId = linkedAssignmentId || null;
    }

    const result = await studyMaterialsCollection.updateOne(
      { _id: new ObjectId(params.materialId) },
      { $set: update }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No changes made' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Study material updated successfully',
    });
  } catch (error) {
    console.error('Error updating study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update study material' },
      { status: 500 }
    );
  }
}

// DELETE - Delete study material (soft delete)
export async function DELETE(
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

    // Delete files from Cloudinary
    if (material.files && Array.isArray(material.files)) {
      for (const file of material.files) {
        if (file.publicId) {
          await deleteFile(file.publicId);
        }
      }
    }

    // Soft delete
    await studyMaterialsCollection.updateOne(
      { _id: new ObjectId(params.materialId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Study material deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete study material' },
      { status: 500 }
    );
  }
}

