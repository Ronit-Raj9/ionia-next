import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, AcademicPlan, CurriculumProgress } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET - Fetch progress for a specific academic plan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const role = searchParams.get('role');

    if (!planId || !teacherId || !role) {
      return NextResponse.json(
        { success: false, error: 'Plan ID, teacher ID, and role are required' },
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
        { success: false, error: 'Only teachers and admins can view progress' },
        { status: 403 }
      );
    }

    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    const curriculumProgressCollection = await getCollection(COLLECTIONS.CURRICULUM_PROGRESS);
    
    // Fetch academic plan
    const academicPlan = await academicPlansCollection.findOne({
      _id: new ObjectId(planId),
      teacherId: teacherId
    }) as AcademicPlan | null;

    if (!academicPlan) {
      return NextResponse.json(
        { success: false, error: 'Academic plan not found' },
        { status: 404 }
      );
    }

    // Fetch detailed curriculum progress if available
    const curriculumProgress = await curriculumProgressCollection.findOne({
      academicPlanId: new ObjectId(planId),
      classId: classId || academicPlan.classId
    }) as CurriculumProgress | null;

    // Calculate detailed progress metrics
    const progressMetrics = calculateProgressMetrics(academicPlan, curriculumProgress);

    return NextResponse.json({
      success: true,
      progress: {
        ...academicPlan.progress,
        ...progressMetrics,
        planId: academicPlan._id?.toString(),
        subject: academicPlan.subject,
        grade: academicPlan.grade,
        academicYear: academicPlan.academicYear,
        classId: academicPlan.classId,
        curriculumProgress: curriculumProgress ? {
          overallProgress: curriculumProgress.overallProgress,
          topicProgress: curriculumProgress.topicProgress,
          weeklyProgress: curriculumProgress.weeklyProgress,
          monthlyProgress: curriculumProgress.monthlyProgress
        } : null
      }
    });

  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}

// PUT - Update progress for specific topics and subtopics
export async function PUT(request: NextRequest) {
  try {
    const { planId, teacherId, classId, role, topicUpdates, subtopicUpdates } = await request.json();

    if (!planId || !teacherId || !role || (!topicUpdates && !subtopicUpdates)) {
      return NextResponse.json(
        { success: false, error: 'Plan ID, teacher ID, role, and updates are required' },
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
        { success: false, error: 'Only teachers and admins can update progress' },
        { status: 403 }
      );
    }

    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    const curriculumProgressCollection = await getCollection(COLLECTIONS.CURRICULUM_PROGRESS);
    
    const academicPlan = await academicPlansCollection.findOne({
      _id: new ObjectId(planId),
      teacherId: teacherId
    }) as AcademicPlan | null;

    if (!academicPlan) {
      return NextResponse.json(
        { success: false, error: 'Academic plan not found' },
        { status: 404 }
      );
    }

    // Update topic completion status
    const updatedPlan = { ...academicPlan };
    
    // Update individual topics
    if (updatedPlan.generatedPlan && updatedPlan.generatedPlan.topics && topicUpdates) {
      updatedPlan.generatedPlan.topics = updatedPlan.generatedPlan.topics.map((topic: any) => {
        const update = topicUpdates.find((u: any) => u.topicId === topic.id);
        if (update) {
          return {
            ...topic,
            completed: update.completed,
            completedDate: update.completed ? new Date() : null,
            notes: update.notes || topic.notes
          };
        }
        return topic;
      });
    }

    // Update subtopics if provided
    if (updatedPlan.generatedPlan && updatedPlan.generatedPlan.topics && subtopicUpdates) {
      updatedPlan.generatedPlan.topics = updatedPlan.generatedPlan.topics.map((topic: any) => {
        if (topic.subtopics) {
          topic.subtopics = topic.subtopics.map((subtopic: any) => {
            const update = subtopicUpdates.find((u: any) => u.subtopicId === subtopic.id);
            if (update) {
              return {
                ...subtopic,
                completed: update.completed,
                completedDate: update.completed ? new Date() : null,
                notes: update.notes || subtopic.notes
              };
            }
            return subtopic;
          });
        }
        return topic;
      });
    }

    // Recalculate progress metrics
    const completedTopics = updatedPlan.generatedPlan.topics.filter((t: any) => t.completed).length;
    const totalTopics = updatedPlan.generatedPlan.topics.length;
    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Calculate subtopic progress
    let completedSubtopics = 0;
    let totalSubtopics = 0;
    updatedPlan.generatedPlan.topics.forEach((topic: any) => {
      if (topic.subtopics) {
        totalSubtopics += topic.subtopics.length;
        completedSubtopics += topic.subtopics.filter((st: any) => st.completed).length;
      }
    });

    // Update progress object
    updatedPlan.progress = {
      totalTopics,
      completedTopics,
      completionPercentage,
      lastUpdated: new Date()
    };

    updatedPlan.updatedAt = new Date();

    // Save academic plan to database
    await academicPlansCollection.updateOne(
      { _id: new ObjectId(planId) },
      { $set: updatedPlan }
    );

    // Update or create curriculum progress record
    await updateCurriculumProgress(
      curriculumProgressCollection,
      new ObjectId(planId),
      classId || academicPlan.classId,
      teacherId,
      updatedPlan
    );

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      progress: {
        ...updatedPlan.progress,
        totalSubtopics,
        completedSubtopics,
        subtopicCompletionPercentage: totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// Helper function to calculate detailed progress metrics
function calculateProgressMetrics(academicPlan: AcademicPlan, curriculumProgress?: CurriculumProgress | null) {
  if (!academicPlan.generatedPlan || !academicPlan.generatedPlan.topics) {
    return {
      weeklyProgress: [],
      monthlyProgress: [],
      upcomingDeadlines: [],
      behindSchedule: 0,
      onTrack: 0,
      totalBehindSchedule: 0,
      totalOnTrack: 0,
      subtopicProgress: {
        totalSubtopics: 0,
        completedSubtopics: 0,
        completionPercentage: 0
      }
    };
  }

  const topics = academicPlan.generatedPlan.topics;
  const currentDate = new Date();
  
  // Calculate subtopic progress
  let totalSubtopics = 0;
  let completedSubtopics = 0;
  topics.forEach((topic: any) => {
    if (topic.subtopics) {
      totalSubtopics += topic.subtopics.length;
      completedSubtopics += topic.subtopics.filter((st: any) => st.completed).length;
    }
  });

  // Calculate weekly and monthly progress
  const weeklyProgress = calculateWeeklyProgress(topics, currentDate);
  const monthlyProgress = calculateMonthlyProgress(topics, currentDate);
  
  // Find upcoming deadlines (next 2 weeks)
  const upcomingDeadlines = topics
    .filter((topic: any) => {
      if (!topic.scheduledDate || topic.completed) return false;
      const topicDate = new Date(topic.scheduledDate);
      const twoWeeksFromNow = new Date(currentDate.getTime() + (14 * 24 * 60 * 60 * 1000));
      return topicDate <= twoWeeksFromNow && topicDate >= currentDate;
    })
    .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  // Find topics behind schedule
  const behindSchedule = topics
    .filter((topic: any) => {
      if (!topic.scheduledDate || topic.completed) return false;
      const topicDate = new Date(topic.scheduledDate);
      return topicDate < currentDate;
    });

  // Find topics on track
  const onTrack = topics
    .filter((topic: any) => {
      if (!topic.scheduledDate) return false;
      if (topic.completed) return true;
      const topicDate = new Date(topic.scheduledDate);
      return topicDate >= currentDate;
    });

  return {
    weeklyProgress,
    monthlyProgress,
    upcomingDeadlines,
    behindSchedule: behindSchedule.length,
    onTrack: onTrack.length,
    totalBehindSchedule: behindSchedule.length,
    totalOnTrack: onTrack.length,
    subtopicProgress: {
      totalSubtopics,
      completedSubtopics,
      completionPercentage: totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0
    },
    // Include curriculum progress data if available
    curriculumProgress: curriculumProgress ? {
      overallProgress: curriculumProgress.overallProgress,
      topicProgress: curriculumProgress.topicProgress,
      weeklyProgress: curriculumProgress.weeklyProgress,
      monthlyProgress: curriculumProgress.monthlyProgress
    } : null
  };
}

function calculateWeeklyProgress(topics: any[], currentDate: Date) {
  const weeks = [];
  const startDate = new Date(currentDate.getTime() - (12 * 7 * 24 * 60 * 60 * 1000)); // 12 weeks ago
  
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const completedInWeek = topics.filter((topic: any) => {
      if (!topic.completedDate) return false;
      const completedDate = new Date(topic.completedDate);
      return completedDate >= weekStart && completedDate < weekEnd;
    }).length;
    
    weeks.push({
      week: `Week ${i + 1}`,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      completed: completedInWeek
    });
  }
  
  return weeks;
}

function calculateMonthlyProgress(topics: any[], currentDate: Date) {
  const months = [];
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1); // 6 months ago
  
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0);
    
    const completedInMonth = topics.filter((topic: any) => {
      if (!topic.completedDate) return false;
      const completedDate = new Date(topic.completedDate);
      return completedDate >= monthStart && completedDate <= monthEnd;
    }).length;
    
    months.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      completed: completedInMonth
    });
  }
  
  return months;
}

// Helper function to update curriculum progress
async function updateCurriculumProgress(
  curriculumProgressCollection: any,
  academicPlanId: ObjectId,
  classId: string,
  teacherId: string,
  academicPlan: AcademicPlan
) {
  try {
    const currentDate = new Date();
    const topics = academicPlan.generatedPlan?.topics || [];
    
    // Calculate overall progress
    const completedTopics = topics.filter((t: any) => t.completed).length;
    const totalTopics = topics.length;
    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    // Calculate subtopic progress
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    topics.forEach((topic: any) => {
      if (topic.subtopics) {
        totalSubtopics += topic.subtopics.length;
        completedSubtopics += topic.subtopics.filter((st: any) => st.completed).length;
      }
    });

    // Create topic progress array
    const topicProgress = topics.map((topic: any) => ({
      topicId: topic.id,
      topicTitle: topic.title,
      status: topic.completed ? 'completed' : 'not_started',
      startedDate: topic.completed ? topic.completedDate : null,
      completedDate: topic.completed ? topic.completedDate : null,
      estimatedHours: topic.estimatedHours || 0,
      completionPercentage: topic.completed ? 100 : 0,
      teacherNotes: topic.notes || ''
    }));

    const curriculumProgressData = {
      academicPlanId,
      classId,
      teacherId,
      overallProgress: {
        totalTopics,
        completedTopics,
        inProgressTopics: 0,
        notStartedTopics: totalTopics - completedTopics,
        completionPercentage,
        averageTopicCompletionTime: 0,
        projectedCompletionDate: currentDate,
        onSchedule: true,
        daysAheadBehind: 0
      },
      topicProgress,
      weeklyProgress: [],
      monthlyProgress: [],
      homeworkIntegration: {
        assignmentsCreated: 0,
        assignmentsCompleted: 0,
        averageScore: 0,
        lastAssignmentDate: null
      },
      lastUpdated: currentDate
    };

    // Upsert curriculum progress
    await curriculumProgressCollection.updateOne(
      { academicPlanId, classId },
      { $set: curriculumProgressData },
      { upsert: true }
    );

  } catch (error) {
    console.error('Error updating curriculum progress:', error);
    // Don't throw error as this is not critical for the main operation
  }
}
