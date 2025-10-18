import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { extractTextFromPDF, extractTextFromDocx } from '@/lib/documentProcessor';
import { generateAcademicPlan } from '@/lib/academicPlanGenerator';
import { uploadFile } from '@/lib/cloudinary';

// GET - Fetch academic plans for a teacher/class
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const role = searchParams.get('role');

    if (!teacherId || !role) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and role are required' },
        { status: 400 }
      );
    }

    // Validate permissions
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can access academic plans' },
        { status: 403 }
      );
    }

    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    
    const query: any = { teacherId };
    if (classId) {
      query.classId = classId;
    }

    const academicPlans = await academicPlansCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      academicPlans: academicPlans.map(plan => ({
        ...plan,
        _id: plan._id.toString()
      }))
    });

  } catch (error) {
    console.error('Academic planner fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch academic plans' },
      { status: 500 }
    );
  }
}

// POST - Create new academic plan from uploaded syllabus
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const teacherId = formData.get('teacherId') as string;
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const grade = formData.get('grade') as string;
    const academicYear = formData.get('academicYear') as string;
    const role = formData.get('role') as string;
    const syllabusFile = formData.get('syllabusFile') as File;
    const calendarFile = formData.get('calendarFile') as File;

    // Validation
    if (!teacherId || !classId || !subject || !grade || !academicYear || !role) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can create academic plans' },
        { status: 403 }
      );
    }

    if (!syllabusFile) {
      return NextResponse.json(
        { success: false, error: 'Syllabus file is required' },
        { status: 400 }
      );
    }

    // Validate file types and size
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(syllabusFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      );
    }

    if (syllabusFile.size > maxFileSize) {
      return NextResponse.json(
        { success: false, error: 'Syllabus file size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate calendar file if provided
    if (calendarFile) {
      if (!allowedTypes.includes(calendarFile.type)) {
        return NextResponse.json(
          { success: false, error: 'Calendar file must be PDF or DOCX format' },
          { status: 400 }
        );
      }

      if (calendarFile.size > maxFileSize) {
        return NextResponse.json(
          { success: false, error: 'Calendar file size must be less than 10MB' },
          { status: 400 }
        );
      }
    }

    // Upload files to Cloudinary
    const syllabusBuffer = Buffer.from(await syllabusFile.arrayBuffer());
    const syllabusUpload = await uploadFile(syllabusBuffer, syllabusFile.name, 'assignments');
    
    if (!syllabusUpload.success) {
      return NextResponse.json(
        { success: false, error: `Failed to upload syllabus file: ${syllabusUpload.error}` },
        { status: 500 }
      );
    }

    let calendarUpload = null;
    if (calendarFile && allowedTypes.includes(calendarFile.type)) {
      const calendarBuffer = Buffer.from(await calendarFile.arrayBuffer());
      calendarUpload = await uploadFile(calendarBuffer, calendarFile.name, 'assignments');
      
      if (!calendarUpload.success) {
        return NextResponse.json(
          { success: false, error: `Failed to upload calendar file: ${calendarUpload.error}` },
          { status: 500 }
        );
      }
    }

    // Extract text from uploaded files
    let syllabusText = '';
    let calendarText = '';

    try {
      if (syllabusUpload.success && syllabusUpload.url) {
        if (syllabusFile.type === 'application/pdf') {
          syllabusText = await extractTextFromPDF(syllabusUpload.url);
        } else if (syllabusFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          syllabusText = await extractTextFromDocx(syllabusUpload.url);
        }
      }

      if (calendarUpload && calendarUpload.success && calendarUpload.url) {
        if (calendarFile.type === 'application/pdf') {
          calendarText = await extractTextFromPDF(calendarUpload.url);
        } else if (calendarFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          calendarText = await extractTextFromDocx(calendarUpload.url);
        }
      }
    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from uploaded files' },
        { status: 500 }
      );
    }

    // Generate academic plan using LLM
    let academicPlanData;
    try {
      academicPlanData = await generateAcademicPlan({
        syllabusText,
        calendarText,
        subject,
        grade,
        academicYear
      });
    } catch (planError) {
      console.error('Academic plan generation error:', planError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate academic plan. Please try again.' },
        { status: 500 }
      );
    }

    // Save to database
    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    
    const academicPlan = {
      teacherId,
      classId,
      subject,
      grade,
      academicYear,
      syllabusFile: {
        originalName: syllabusFile.name,
        url: syllabusUpload.url || '',
        publicId: syllabusUpload.publicId || '',
        size: syllabusFile.size,
        type: syllabusFile.type
      },
      calendarFile: calendarUpload && calendarUpload.success ? {
        originalName: calendarFile.name,
        url: calendarUpload.url || '',
        publicId: calendarUpload.publicId || '',
        size: calendarFile.size,
        type: calendarFile.type
      } : null,
      extractedContent: {
        syllabusText,
        calendarText
      },
      generatedPlan: academicPlanData,
      status: 'active',
      progress: {
        totalTopics: academicPlanData.topics?.length || 0,
        completedTopics: 0,
        completionPercentage: 0,
        lastUpdated: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await academicPlansCollection.insertOne(academicPlan);

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: 'Failed to save academic plan to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Academic plan created successfully',
      academicPlan: {
        ...academicPlan,
        _id: result.insertedId.toString()
      }
    });

  } catch (error) {
    console.error('Academic plan creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create academic plan' },
      { status: 500 }
    );
  }
}
