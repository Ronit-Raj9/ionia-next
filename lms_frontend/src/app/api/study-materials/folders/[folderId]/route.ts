import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { connectToDatabase, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';

// DELETE - Delete a folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
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
    const foldersCollection = db.collection(COLLECTIONS.STUDY_MATERIAL_FOLDERS);
    const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);

    // Verify folder exists and belongs to teacher
    const folder = await foldersCollection.findOne({
      _id: new ObjectId(params.folderId),
      teacherId: session.userId,
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found or access denied' },
        { status: 404 }
      );
    }

    // Check if folder has any materials
    const materialsCount = await studyMaterialsCollection.countDocuments({
      folderId: new ObjectId(params.folderId),
      isActive: true,
    });

    if (materialsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete folder with materials. Please move or delete materials first.' },
        { status: 400 }
      );
    }

    // Check if folder has subfolders
    const subfoldersCount = await foldersCollection.countDocuments({
      parentFolderId: new ObjectId(params.folderId),
    });

    if (subfoldersCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete folder with subfolders. Please delete subfolders first.' },
        { status: 400 }
      );
    }

    // Delete folder
    await foldersCollection.deleteOne({
      _id: new ObjectId(params.folderId),
    });

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}

// PUT - Update folder
export async function PUT(
  request: NextRequest,
  { params }: { params: { folderId: string } }
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
    const { folderName, description } = body;

    const { db } = await connectToDatabase();
    const foldersCollection = db.collection(COLLECTIONS.STUDY_MATERIAL_FOLDERS);

    // Verify folder exists and belongs to teacher
    const folder = await foldersCollection.findOne({
      _id: new ObjectId(params.folderId),
      teacherId: session.userId,
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found or access denied' },
        { status: 404 }
      );
    }

    // Check if new folder name conflicts
    if (folderName && folderName !== folder.folderName) {
      const existingFolder = await foldersCollection.findOne({
        classId: folder.classId,
        teacherId: session.userId,
        folderName,
        parentFolderId: folder.parentFolderId || null,
        _id: { $ne: new ObjectId(params.folderId) },
      });

      if (existingFolder) {
        return NextResponse.json(
          { success: false, error: 'Folder with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update folder
    const update: any = {
      updatedAt: new Date(),
    };
    if (folderName) update.folderName = folderName;
    if (description !== undefined) update.description = description;

    await foldersCollection.updateOne(
      { _id: new ObjectId(params.folderId) },
      { $set: update }
    );

    // Also update folderName in materials
    if (folderName) {
      const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);
      await studyMaterialsCollection.updateMany(
        { folderId: new ObjectId(params.folderId) },
        { $set: { folderName, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Folder updated successfully',
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

