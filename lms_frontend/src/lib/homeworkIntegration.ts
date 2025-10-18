import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';

export interface HomeworkIntegrationData {
  academicPlanId: ObjectId;
  topicId: string;
  topicTitle: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  keyConceptsToMaster: string[];
  prerequisites: string[];
  estimatedHours: number;
}

export interface PersonalizationSettings {
  difficultyAdaptation: boolean;
  prerequisiteChecking: boolean;
  progressTracking: boolean;
  adaptiveContent: boolean;
}

export interface StudentPerformanceData {
  studentId: string;
  topicPerformance: {
    [topicId: string]: {
      averageScore: number;
      completionRate: number;
      timeSpent: number;
      strugglingAreas: string[];
      strongAreas: string[];
    };
  };
  overallProgress: {
    completionPercentage: number;
    averageScore: number;
    recommendedDifficulty: 'basic' | 'intermediate' | 'advanced';
  };
}

/**
 * Get homework recommendations based on academic plan progress
 */
export async function getHomeworkRecommendations(
  academicPlanId: string,
  studentId: string,
  currentTopicId?: string
): Promise<{
  recommendedTopics: string[];
  suggestedDifficulty: 'basic' | 'intermediate' | 'advanced';
  remedialContent: string[];
  enrichmentActivities: string[];
  nextTopicPreparation: string[];
}> {
  try {
    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    const curriculumProgressCollection = await getCollection(COLLECTIONS.CURRICULUM_PROGRESS);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    // Get academic plan
    const academicPlan = await academicPlansCollection.findOne({
      _id: new ObjectId(academicPlanId)
    });

    if (!academicPlan) {
      throw new Error('Academic plan not found');
    }

    // Get student's progress
    const studentProgress = await curriculumProgressCollection.findOne({
      academicPlanId: new ObjectId(academicPlanId),
      'topicProgress.studentId': studentId
    });

    // Get student's performance data
    const studentPerformance = await submissionsCollection.aggregate([
      {
        $match: {
          studentId: studentId,
          'metadata.academicPlanId': new ObjectId(academicPlanId)
        }
      },
      {
        $group: {
          _id: '$metadata.topicId',
          averageScore: { $avg: '$grade.score' },
          submissionCount: { $sum: 1 },
          totalTimeSpent: { $sum: '$metadata.timeSpent' }
        }
      }
    ]).toArray();

    // Analyze performance and generate recommendations
    const recommendations = analyzePerformanceAndRecommend(
      academicPlan.generatedPlan.topics,
      studentProgress,
      studentPerformance,
      currentTopicId
    );

    return recommendations;

  } catch (error) {
    console.error('Error getting homework recommendations:', error);
    throw error;
  }
}

/**
 * Check if student meets prerequisites for a topic
 */
export async function checkPrerequisites(
  academicPlanId: string,
  studentId: string,
  topicId: string
): Promise<{
  meetsPrerequisites: boolean;
  missingPrerequisites: string[];
  recommendedActions: string[];
}> {
  try {
    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    const academicPlan = await academicPlansCollection.findOne({
      _id: new ObjectId(academicPlanId)
    });

    if (!academicPlan) {
      throw new Error('Academic plan not found');
    }

    const topic = academicPlan.generatedPlan.topics.find((t: any) => t.id === topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const prerequisites = topic.prerequisites || [];
    const missingPrerequisites: string[] = [];
    const recommendedActions: string[] = [];

    // Check each prerequisite
    for (const prereqId of prerequisites) {
      const prereqPerformance = await submissionsCollection.findOne({
        studentId: studentId,
        'metadata.academicPlanId': new ObjectId(academicPlanId),
        'metadata.topicId': prereqId,
        'grade.score': { $gte: 70 } // Minimum 70% to consider prerequisite met
      });

      if (!prereqPerformance) {
        const prereqTopic = academicPlan.generatedPlan.topics.find((t: any) => t.id === prereqId);
        if (prereqTopic) {
          missingPrerequisites.push(prereqTopic.title);
          recommendedActions.push(`Complete ${prereqTopic.title} with at least 70% score`);
        }
      }
    }

    return {
      meetsPrerequisites: missingPrerequisites.length === 0,
      missingPrerequisites,
      recommendedActions
    };

  } catch (error) {
    console.error('Error checking prerequisites:', error);
    throw error;
  }
}

/**
 * Adapt homework difficulty based on student performance
 */
export async function adaptHomeworkDifficulty(
  academicPlanId: string,
  studentId: string,
  topicId: string,
  baseAssignment: any
): Promise<{
  adaptedAssignment: any;
  difficultyLevel: 'basic' | 'intermediate' | 'advanced';
  adaptationReason: string;
  suggestions: string[];
}> {
  try {
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    // Get student's recent performance
    const recentPerformance = await submissionsCollection.aggregate([
      {
        $match: {
          studentId: studentId,
          'metadata.academicPlanId': new ObjectId(academicPlanId),
          submissionTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$grade.score' },
          submissionCount: { $sum: 1 },
          recentScores: { $push: '$grade.score' }
        }
      }
    ]).toArray();

    let difficultyLevel: 'basic' | 'intermediate' | 'advanced' = 'intermediate';
    let adaptationReason = 'Standard difficulty based on grade level';
    const suggestions: string[] = [];

    if (recentPerformance.length > 0) {
      const performance = recentPerformance[0];
      const averageScore = performance.averageScore;

      if (averageScore >= 85) {
        difficultyLevel = 'advanced';
        adaptationReason = 'High performance - providing challenging content';
        suggestions.push('Include extension questions');
        suggestions.push('Add critical thinking components');
        suggestions.push('Provide opportunities for peer teaching');
      } else if (averageScore < 65) {
        difficultyLevel = 'basic';
        adaptationReason = 'Needs additional support - providing foundational content';
        suggestions.push('Include step-by-step guidance');
        suggestions.push('Provide additional examples');
        suggestions.push('Add remedial practice questions');
      } else {
        difficultyLevel = 'intermediate';
        adaptationReason = 'Steady progress - maintaining current difficulty';
        suggestions.push('Continue with standard difficulty');
        suggestions.push('Include variety in question types');
      }
    }

    // Adapt the assignment based on difficulty level
    const adaptedAssignment = {
      ...baseAssignment,
      difficulty: difficultyLevel,
      adaptations: {
        difficultyLevel,
        adaptationReason,
        suggestions,
        originalDifficulty: baseAssignment.difficulty || 'intermediate'
      }
    };

    return {
      adaptedAssignment,
      difficultyLevel,
      adaptationReason,
      suggestions
    };

  } catch (error) {
    console.error('Error adapting homework difficulty:', error);
    throw error;
  }
}

/**
 * Track homework completion and update curriculum progress
 */
export async function trackHomeworkCompletion(
  submissionId: string,
  academicPlanId: string,
  topicId: string,
  studentId: string,
  score: number,
  timeSpent: number
): Promise<void> {
  try {
    const curriculumProgressCollection = await getCollection(COLLECTIONS.CURRICULUM_PROGRESS);

    // Update curriculum progress with homework completion data
    await curriculumProgressCollection.updateOne(
      {
        academicPlanId: new ObjectId(academicPlanId),
        'homeworkIntegration.topicBasedAssignments.topicId': topicId
      },
      {
        $addToSet: {
          'homeworkIntegration.topicBasedAssignments.$.assignmentIds': new ObjectId(submissionId)
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Update AI insights based on homework performance
    await updateAIInsights(academicPlanId, topicId, studentId, score);

  } catch (error) {
    console.error('Error tracking homework completion:', error);
    throw error;
  }
}

/**
 * Get integration status for full-stack engineer reference
 */
export async function getIntegrationStatus(academicPlanId: string): Promise<{
  isIntegrated: boolean;
  integrationPoints: any;
  connectedAssignments: number;
  trackingMetrics: any;
  nextSteps: string[];
}> {
  try {
    const academicPlansCollection = await getCollection(COLLECTIONS.ACADEMIC_PLANS);
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);

    const academicPlan = await academicPlansCollection.findOne({
      _id: new ObjectId(academicPlanId)
    });

    if (!academicPlan) {
      throw new Error('Academic plan not found');
    }

    const connectedAssignments = await assignmentsCollection.countDocuments({
      'metadata.academicPlanId': new ObjectId(academicPlanId)
    });

    const integrationPoints = academicPlan.generatedPlan.integrationPoints || {};
    const isIntegrated = connectedAssignments > 0 && integrationPoints.homeworkPersonalization?.topicBasedAssignment;

    const nextSteps = [];
    if (!isIntegrated) {
      nextSteps.push('Enable homework personalization in academic plan settings');
      nextSteps.push('Create assignments linked to academic plan topics');
      nextSteps.push('Configure difficulty adaptation settings');
    } else {
      nextSteps.push('Monitor student performance and adjust difficulty');
      nextSteps.push('Review prerequisite checking effectiveness');
      nextSteps.push('Analyze progress tracking data');
    }

    return {
      isIntegrated,
      integrationPoints,
      connectedAssignments,
      trackingMetrics: {
        totalTopics: academicPlan.generatedPlan.topics.length,
        topicsWithHomework: connectedAssignments,
        integrationPercentage: Math.round((connectedAssignments / academicPlan.generatedPlan.topics.length) * 100)
      },
      nextSteps
    };

  } catch (error) {
    console.error('Error getting integration status:', error);
    throw error;
  }
}

// Helper functions

function analyzePerformanceAndRecommend(
  topics: any[],
  studentProgress: any,
  studentPerformance: any[],
  currentTopicId?: string
): any {
  const performanceMap = new Map();
  studentPerformance.forEach(perf => {
    performanceMap.set(perf._id, perf);
  });

  const recommendedTopics: string[] = [];
  const remedialContent: string[] = [];
  const enrichmentActivities: string[] = [];
  const nextTopicPreparation: string[] = [];

  let suggestedDifficulty: 'basic' | 'intermediate' | 'advanced' = 'intermediate';

  // Analyze overall performance
  const averageScore = studentPerformance.reduce((sum, perf) => sum + perf.averageScore, 0) / studentPerformance.length;

  if (averageScore >= 85) {
    suggestedDifficulty = 'advanced';
    enrichmentActivities.push('Advanced problem-solving exercises');
    enrichmentActivities.push('Research projects');
    enrichmentActivities.push('Peer tutoring opportunities');
  } else if (averageScore < 65) {
    suggestedDifficulty = 'basic';
    remedialContent.push('Review fundamental concepts');
    remedialContent.push('Additional practice exercises');
    remedialContent.push('One-on-one support sessions');
  }

  // Find topics that need attention
  topics.forEach(topic => {
    const performance = performanceMap.get(topic.id);
    if (!performance || performance.averageScore < 70) {
      recommendedTopics.push(topic.id);
    }
  });

  // Suggest next topic preparation
  if (currentTopicId) {
    const currentTopicIndex = topics.findIndex(t => t.id === currentTopicId);
    if (currentTopicIndex >= 0 && currentTopicIndex < topics.length - 1) {
      const nextTopic = topics[currentTopicIndex + 1];
      nextTopicPreparation.push(`Prepare for ${nextTopic.title}`);
      nextTopic.prerequisites?.forEach((prereq: string) => {
        nextTopicPreparation.push(`Review ${prereq} concepts`);
      });
    }
  }

  return {
    recommendedTopics,
    suggestedDifficulty,
    remedialContent,
    enrichmentActivities,
    nextTopicPreparation
  };
}

async function updateAIInsights(
  academicPlanId: string,
  topicId: string,
  studentId: string,
  score: number
): Promise<void> {
  const curriculumProgressCollection = await getCollection(COLLECTIONS.CURRICULUM_PROGRESS);

  const insights: any = {};

  if (score < 60) {
    insights.strugglingTopics = [topicId];
    insights.suggestedInterventions = ['Provide additional support', 'Review prerequisite concepts'];
  } else if (score >= 85) {
    insights.strongTopics = [topicId];
    insights.enrichmentActivities = [{ topicId, activities: ['Advanced exercises', 'Extension projects'] }];
  }

  await curriculumProgressCollection.updateOne(
    { academicPlanId: new ObjectId(academicPlanId) },
    {
      $set: {
        'aiInsights.lastAnalyzed': new Date(),
        updatedAt: new Date()
      },
      $addToSet: insights
    }
  );
}
