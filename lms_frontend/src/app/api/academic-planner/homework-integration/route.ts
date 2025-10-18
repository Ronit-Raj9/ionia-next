import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Assignment, AcademicPlan } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getHomeworkIntegrationSuggestions } from '@/lib/academicPlanGenerator';

// GET - Get homework integration suggestions for a topic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const topicId = searchParams.get('topicId');
    const teacherId = searchParams.get('teacherId');
    const role = searchParams.get('role');

    if (!planId || !topicId || !teacherId || !role) {
      return NextResponse.json(
        { success: false, error: 'Plan ID, topic ID, teacher ID, and role are required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Validate permissions
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can access homework integration' },
        { status: 403 }
      );
    }

    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    
    const academicPlan = await academicPlansCollection.findOne({
      _id: new ObjectId(planId),
      teacherId: teacherId
    });

    if (!academicPlan) {
      return NextResponse.json(
        { success: false, error: 'Academic plan not found' },
        { status: 404 }
      );
    }

    // Get the topic from the academic plan
    const topic = academicPlan.generatedPlan.topics.find((t: any) => t.id === topicId);
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found in academic plan' },
        { status: 404 }
      );
    }

    // Get homework integration suggestions
    const suggestions = await getHomeworkIntegrationSuggestions(topicId, academicPlan.generatedPlan);

    // Get related assignments if any exist
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const relatedAssignments = await assignmentsCollection
      .find({
        createdBy: teacherId,
        topic: topic.title,
        subject: academicPlan.subject,
        grade: academicPlan.grade
      })
      .toArray();

    // Get student performance data for this topic
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const topicPerformance = await submissionsCollection.aggregate([
      {
        $lookup: {
          from: 'assignments',
          localField: 'assignmentId',
          foreignField: '_id',
          as: 'assignment'
        }
      },
      {
        $match: {
          'assignment.topic': topic.title,
          'assignment.subject': academicPlan.subject,
          'assignment.grade': academicPlan.grade
        }
      },
      {
        $group: {
          _id: '$studentId',
          averageScore: { $avg: '$grade.score' },
          submissionCount: { $sum: 1 },
          lastSubmission: { $max: '$submittedAt' }
        }
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      integrationData: {
        topic,
        suggestions,
        relatedAssignments: relatedAssignments.map(assignment => ({
          ...assignment,
          _id: assignment._id.toString()
        })),
        topicPerformance,
        integrationPoints: academicPlan.generatedPlan.integrationPoints
      }
    });

  } catch (error) {
    console.error('Homework integration fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homework integration data' },
      { status: 500 }
    );
  }
}

// POST - Create personalized homework based on academic plan topic
export async function POST(request: NextRequest) {
  try {
    const {
      planId,
      topicId,
      teacherId,
      classId,
      role,
      assignmentData,
      personalizationSettings
    } = await request.json();

    if (!planId || !topicId || !teacherId || !classId || !role || !assignmentData) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Validate permissions
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can create homework' },
        { status: 403 }
      );
    }

    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    
    const academicPlan = await academicPlansCollection.findOne({
      _id: new ObjectId(planId),
      teacherId: teacherId
    });

    if (!academicPlan) {
      return NextResponse.json(
        { success: false, error: 'Academic plan not found' },
        { status: 404 }
      );
    }

    const topic = academicPlan.generatedPlan.topics.find((t: any) => t.id === topicId);
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found in academic plan' },
        { status: 404 }
      );
    }

    // Create assignment with academic plan integration
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    
    const assignment: Partial<Assignment> = {
      ...assignmentData,
      classId: classId,
      createdBy: teacherId,
      subject: academicPlan.subject,
      grade: academicPlan.grade,
      topic: topic.title,
      difficulty: topic.difficulty === 'basic' ? 'easy' : topic.difficulty === 'intermediate' ? 'medium' : 'hard',
      personalizationEnabled: personalizationSettings?.difficultyAdaptation || true,
      assignmentType: personalizationSettings?.difficultyAdaptation ? 'personalized' : 'standard',
      studyMaterialReference: {
        bookTitle: `Academic Plan - ${academicPlan.subject}`,
        chapter: topic.title,
        topics: topic.keyConceptsToMaster
      },
      createdAt: new Date()
    };

    const result = await assignmentsCollection.insertOne(assignment);

    // Update curriculum progress to track homework integration
    const curriculumProgressCollection = await getCollection(COLLECTIONS.CURRICULUM_PROGRESS);
    
    await curriculumProgressCollection.updateOne(
      {
        academicPlanId: new ObjectId(planId),
        classId: classId,
        teacherId: teacherId
      },
      {
        $addToSet: {
          'topicProgress': {
            topicId: topicId,
            topicTitle: topic.title,
            assignmentIds: [result.insertedId],
            averageScore: 0,
            completionRate: 0,
            lastUpdated: new Date()
          }
        },
        $set: {
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Homework created successfully with academic plan integration',
      assignment: {
        ...assignment,
        _id: result.insertedId.toString()
      }
    });

  } catch (error) {
    console.error('Homework integration creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create integrated homework' },
      { status: 500 }
    );
  }
}

// PUT - Update homework integration settings
export async function PUT(request: NextRequest) {
  try {
    const {
      planId,
      teacherId,
      role,
      integrationSettings
    } = await request.json();

    if (!planId || !teacherId || !role || !integrationSettings) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Validate permissions
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can update integration settings' },
        { status: 403 }
      );
    }

    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    
    const updateResult = await academicPlansCollection.updateOne(
      {
        _id: new ObjectId(planId),
        teacherId: teacherId
      },
      {
        $set: {
          'generatedPlan.integrationPoints': integrationSettings,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Academic plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Integration settings updated successfully'
    });

  } catch (error) {
    console.error('Integration settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update integration settings' },
      { status: 500 }
    );
  }
}