import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { connectToDatabase, COLLECTIONS, StudyMaterial } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { uploadFile, extractPublicId } from '@/lib/cloudinary';

// POST - Upload/Create study materials
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Teacher access required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const classId = formData.get('classId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const folderId = formData.get('folderId') as string;
    const status = (formData.get('status') as string) || 'draft';
    const linkedAssignmentId = formData.get('linkedAssignmentId') as string;

    if (!classId || !title) {
      return NextResponse.json(
        { success: false, error: 'Class ID and title are required' },
        { status: 400 }
      );
    }

    // Get files from form data
    const files: File[] = [];
    const fileEntries = formData.getAll('files') as File[];
    fileEntries.forEach(file => {
      if (file instanceof File && file.size > 0) {
        files.push(file);
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // Validate file sizes (20MB limit)
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 20MB limit` },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();
    const classesCollection = db.collection(COLLECTIONS.CLASSES);
    const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);

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

    // Upload files to Cloudinary
    const uploadedFiles: StudyMaterial['files'] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadFile(buffer, file.name, 'study-materials');

      if (!uploadResult.success || !uploadResult.url) {
        return NextResponse.json(
          { success: false, error: `Failed to upload ${file.name}` },
          { status: 500 }
        );
      }

      uploadedFiles.push({
        fileName: file.name,
        fileUrl: uploadResult.url,
        fileType: file.type,
        fileSize: file.size,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
      });
    }

    // Get folder name if folderId provided
    let folderName: string | undefined;
    if (folderId) {
      const foldersCollection = db.collection(COLLECTIONS.STUDY_MATERIAL_FOLDERS);
      const folder = await foldersCollection.findOne({
        _id: new ObjectId(folderId),
        classId,
        teacherId: session.userId,
      });
      if (folder) {
        folderName = folder.folderName;
      }
    }

    // Create study material document
    const studyMaterial: Omit<StudyMaterial, '_id'> = {
      classId,
      schoolId: classData.schoolId,
      teacherId: session.userId,
      teacherName: session.name,
      title,
      description: description || undefined,
      folderId: folderId ? new ObjectId(folderId) : undefined,
      folderName,
      files: uploadedFiles,
      linkedAssignmentId: linkedAssignmentId || undefined,
      status: status as 'draft' | 'published',
      isActive: true,
      bookmarkedBy: [],
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: status === 'published' ? new Date() : undefined,
    };

    const result = await studyMaterialsCollection.insertOne(studyMaterial);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...studyMaterial,
      },
      message: status === 'published' 
        ? 'Study material uploaded and broadcast to class'
        : 'Study material saved as draft',
    });
  } catch (error) {
    console.error('Error uploading study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload study material' },
      { status: 500 }
    );
  }
}

// GET - Get study materials (with filters)
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
    const role = searchParams.get('role');
    const status = searchParams.get('status'); // 'draft' | 'published' | 'all'
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');

    // Validate classId for teachers - must be a valid ObjectId if provided
    if (role === 'teacher' && classId) {
      // Check if classId is a valid ObjectId format (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(classId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid class ID format' },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();
    const studyMaterialsCollection = db.collection(COLLECTIONS.STUDY_MATERIALS);

    let query: any = { isActive: true };

    if (role === 'teacher') {
      // Teachers see all their materials (draft and published)
      query.teacherId = session.userId;
      // Only add classId if it's valid and not empty
      if (classId && classId.trim() !== '' && /^[0-9a-fA-F]{24}$/.test(classId)) {
        query.classId = classId;
      }
      if (status && status !== 'all') {
        query.status = status;
      }
    } else if (role === 'student') {
      // Students only see published materials
      query.status = 'published';
      // Only add classId if it's valid and not empty
      if (classId && classId.trim() !== '' && /^[0-9a-fA-F]{24}$/.test(classId)) {
        query.classId = classId;
      }
    }

    // Handle folderId - validate it's a valid ObjectId before using it
    if (folderId && folderId.trim() !== '') {
      if (folderId === 'root') {
        // Only show root materials (no folder)
        query.$or = [
          { folderId: { $exists: false } },
          { folderId: null },
        ];
      } else {
        // Validate folderId is a valid ObjectId format
        if (/^[0-9a-fA-F]{24}$/.test(folderId)) {
          query.folderId = new ObjectId(folderId);
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid folder ID format' },
            { status: 400 }
          );
        }
      }
    }

    // Handle search - merge with existing $or if folderId query exists
    if (search && search.trim() !== '') {
      const searchQuery = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };

      // If there's already an $or for folderId, merge them
      if (query.$or) {
        // Combine folderId conditions with search conditions
        query.$and = [
          { $or: query.$or },
          { $or: searchQuery.$or },
        ];
        delete query.$or;
      } else {
        query.$or = searchQuery.$or;
      }
    }

    const materials = await studyMaterialsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // For students, add bookmark status
    if (role === 'student') {
      const materialsWithBookmark = materials.map((material: any) => ({
        ...material,
        isBookmarked: material.bookmarkedBy?.includes(session.userId) || false,
      }));
      return NextResponse.json({
        success: true,
        data: materialsWithBookmark,
      });
    }

    return NextResponse.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error('Error fetching study materials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study materials' },
      { status: 500 }
    );
  }
}

