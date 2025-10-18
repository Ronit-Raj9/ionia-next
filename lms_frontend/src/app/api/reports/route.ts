import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Progress, StudentProfile, Class } from '@/lib/db';
import { generateAndSaveReport, prepareReportData } from '@/lib/reportGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, userId, classId, format, reportType } = body;

    // Validate required fields
    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    // Validate role permissions
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can generate reports' },
        { status: 403 }
      );
    }

    if (!format || !reportType) {
      return NextResponse.json(
        { success: false, error: 'Format and reportType are required' },
        { status: 400 }
      );
    }

    if (!['PDF', 'Excel'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Format must be PDF or Excel' },
        { status: 400 }
      );
    }

    if (!['progress', 'analytics', 'parent_summary'].includes(reportType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Get data for report generation
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    // Find class data - teachers can access their classes, admins can access any class
    let classData: Class | null = null;
    if (role === 'teacher') {
      classData = await classesCollection.findOne({ 
        teacherId: userId
      }) as unknown as Class | null;
    } else if (role === 'admin') {
      classData = await classesCollection.findOne({ 
        _id: classId ? new ObjectId(classId) : { $exists: true }
      }) as unknown as Class | null;
    }

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found or access denied' },
        { status: 404 }
      );
    }

    const progressRecords = await progressCollection.find({ 
      classId: classData._id?.toString() || classId || '' 
    }).toArray() as unknown as Progress[];

    const studentProfiles = await profilesCollection.find({
      studentId: { $in: progressRecords.map(p => p.studentId) }
    }).toArray() as unknown as StudentProfile[];

    if (progressRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No progress data found for report generation' },
        { status: 404 }
      );
    }

    // Prepare report data
    const reportData = prepareReportData(progressRecords, studentProfiles, classData);

    // Generate and save report
    const className = classData.className || 'Class';
    const result = await generateAndSaveReport(reportData, format, reportType, className);

    // Save report metadata to database
    const reportMetadata = {
      format,
      url: result.url,
      generatedAt: result.generatedAt,
      type: reportType,
      generatedBy: userId,
      classId: classData._id?.toString() || classId || ''
    };

    // Update progress records with report export info
    await progressCollection.updateMany(
      { classId: classData._id?.toString() || classId || 'demo-class-1' },
      { 
        $push: { 
          reportExports: reportMetadata 
        } 
      } as any
    );

    return NextResponse.json({
      success: true,
      data: {
        reportUrl: result.url,
        generatedAt: result.generatedAt,
        format,
        reportType,
        metadata: reportMetadata
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId') || '';

    // Validate required fields
    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    // Validate role permissions
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can view reports' },
        { status: 403 }
      );
    }

    // Get class data to verify access
    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    let classData: Class | null = null;
    
    if (role === 'teacher') {
      classData = await classesCollection.findOne({ 
        teacherId: userId
      }) as unknown as Class | null;
    } else if (role === 'admin') {
      classData = await classesCollection.findOne({ 
        _id: classId ? new ObjectId(classId) : { $exists: true }
      }) as unknown as Class | null;
    }

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found or access denied' },
        { status: 404 }
      );
    }

    // Get existing reports
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const progressRecords = await progressCollection.find({ 
      classId: classData._id?.toString() || classId 
    }).toArray();

    // Extract all report exports
    const allReports = progressRecords
      .flatMap(p => p.reportExports || [])
      .filter((report, index, self) => 
        // Remove duplicates based on URL
        index === self.findIndex(r => r.url === report.url)
      )
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, 20); // Limit to 20 most recent reports

    return NextResponse.json({
      success: true,
      data: {
        reports: allReports,
        classInfo: {
          className: classData.className,
          classId: classData._id?.toString()
        }
      }
    });

  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
