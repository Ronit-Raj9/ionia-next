import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { connectToDatabase, COLLECTIONS, StudyMaterialFolder } from '@/lib/db';
import { ObjectId } from 'mongodb';

// POST - Create a folder
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Teacher access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { classId, folderName, parentFolderId, description } = body;

    if (!classId || !folderName) {
      return NextResponse.json(
        { success: false, error: 'Class ID and folder name are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const classesCollection = db.collection(COLLECTIONS.CLASSES);
    const foldersCollection = db.collection(COLLECTIONS.STUDY_MATERIAL_FOLDERS);

    // Verify class exists and teacher has access
    const classData = await classesCollection.findOne({
      _id: new ObjectId(classId),
      teacherId: session.userId,
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found or access denied' },
        { status: 404 }
      );
    }

    // Check if folder name already exists in same location
    const existingFolder = await foldersCollection.findOne({
      classId,
      teacherId: session.userId,
      folderName,
      parentFolderId: parentFolderId ? new ObjectId(parentFolderId) : null,
    });

    if (existingFolder) {
      return NextResponse.json(
        { success: false, error: 'Folder with this name already exists' },
        { status: 400 }
      );
    }

    // Create folder
    const folder: Omit<StudyMaterialFolder, '_id'> = {
      classId,
      schoolId: classData.schoolId,
      teacherId: session.userId,
      folderName,
      parentFolderId: parentFolderId ? new ObjectId(parentFolderId) : undefined,
      description: description || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await foldersCollection.insertOne(folder);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...folder,
      },
      message: 'Folder created successfully',
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

// GET - Get folders for a class
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const foldersCollection = db.collection(COLLECTIONS.STUDY_MATERIAL_FOLDERS);

    let query: any = { classId };

    if (session.role === 'teacher') {
      query.teacherId = session.userId;
    }

    const folders = await foldersCollection
      .find(query)
      .sort({ folderName: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

