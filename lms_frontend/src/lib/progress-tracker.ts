/**
 * Progress Tracking and Mastery Calculation
 * Automatically updates student profiles after grading
 */

import { getCollection, COLLECTIONS, StudentProfile, Assignment, Submission } from './db';
import { ObjectId } from 'mongodb';

export interface ProgressUpdateResult {
  masteryUpdated: boolean;
  previousMastery: number;
  newMastery: number;
  weaknessesIdentified: string[];
  improvementFromPrevious: number;
  badgesEarned: string[];
}

/**
 * Update student mastery after assignment submission
 */
export async function updateStudentMastery(
  studentId: string,
  assignment: Assignment,
  submission: Submission,
  detailedGrading: any
): Promise<ProgressUpdateResult> {
  try {
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const studentProfile = await profilesCollection.findOne({ studentId }) as unknown as StudentProfile;

    if (!studentProfile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }

    const subject = assignment.subject || 'Science';
    const grade = assignment.grade || '9';
    const topic = assignment.topic || 'General';
    const scorePercentage = (submission.grade?.score || 0) / (assignment.maxScore || 100) * 100;

    // Find or create subject mastery entry
    let subjectMastery = studentProfile.subjectMastery?.find(
      sm => sm.subject === subject && sm.grade === grade
    );

    if (!subjectMastery) {
      subjectMastery = {
        subject,
        grade,
        topics: [],
        overallMasteryScore: 0
      };
      
      if (!studentProfile.subjectMastery) {
        studentProfile.subjectMastery = [];
      }
      studentProfile.subjectMastery.push(subjectMastery);
    }

    // Find or create topic entry
    let topicEntry = subjectMastery.topics.find(t => t.name === topic);
    const previousMastery = topicEntry?.masteryScore || 0;

    if (!topicEntry) {
      topicEntry = {
        name: topic,
        masteryScore: 0,
        weaknesses: [],
        lastPracticed: new Date(),
        consecutiveHighScores: 0
      };
      subjectMastery.topics.push(topicEntry);
    }

    // Calculate new mastery score (weighted average with emphasis on recent performance)
    const oldWeight = 0.6;
    const newWeight = 0.4;
    const newMastery = Math.round((topicEntry.masteryScore * oldWeight) + (scorePercentage * newWeight));
    
    // Update consecutive high scores
    if (scorePercentage >= 80) {
      topicEntry.consecutiveHighScores = (topicEntry.consecutiveHighScores || 0) + 1;
    } else {
      topicEntry.consecutiveHighScores = 0;
    }

    // Extract weaknesses from detailed grading
    const weaknessesIdentified: string[] = [];
    if (detailedGrading?.errorAnalysis) {
      weaknessesIdentified.push(...detailedGrading.errorAnalysis
        .filter((e: any) => e.severity !== 'minor')
        .map((e: any) => e.errorType || e.description)
      );
    }

    if (detailedGrading?.areasForImprovement) {
      weaknessesIdentified.push(...detailedGrading.areasForImprovement
        .map((area: any) => typeof area === 'string' ? area : area.concept)
      );
    }

    // Update topic entry
    topicEntry.masteryScore = newMastery;
    topicEntry.weaknesses = Array.from(new Set(weaknessesIdentified)); // Remove duplicates
    topicEntry.lastPracticed = new Date();

    // Recalculate overall subject mastery
    const avgMastery = subjectMastery.topics.reduce((sum, t) => sum + t.masteryScore, 0) / subjectMastery.topics.length;
    subjectMastery.overallMasteryScore = Math.round(avgMastery);

    // Add to assignment history
    if (!studentProfile.assignmentHistory) {
      studentProfile.assignmentHistory = [];
    }

    const improvement = newMastery - previousMastery;
    
    studentProfile.assignmentHistory.push({
      assignmentId: assignment._id!.toString(),
      submissionId: submission._id!.toString(),
      subject,
      topic,
      score: scorePercentage,
      submittedAt: submission.submissionTime || new Date(),
      performance: scorePercentage >= 85 ? 'excellent' : scorePercentage >= 70 ? 'good' : scorePercentage >= 50 ? 'average' : 'poor',
      improvementFromPrevious: improvement
    });

    // Check for badges
    const badgesEarned: string[] = [];
    
    if (topicEntry.consecutiveHighScores >= 3) {
      badgesEarned.push('Topic Master: ' + topic);
    }
    
    if (newMastery >= 90 && previousMastery < 90) {
      badgesEarned.push('Excellence Achievement: ' + topic);
    }
    
    if (improvement >= 20) {
      badgesEarned.push('Rapid Improvement: +' + improvement + '% in ' + topic);
    }

    // Update engagement metrics
    if (studentProfile.engagementMetrics) {
      studentProfile.engagementMetrics.totalTimeSpent = (studentProfile.engagementMetrics.totalTimeSpent || 0) + 30; // Assume 30 min per assignment
      
      if (scorePercentage >= 70) {
        studentProfile.engagementMetrics.streakDays = (studentProfile.engagementMetrics.streakDays || 0) + 1;
      } else {
        studentProfile.engagementMetrics.streakDays = 0;
      }
      
      studentProfile.engagementMetrics.badgeCount = (studentProfile.engagementMetrics.badgeCount || 0) + badgesEarned.length;
      
      // Calculate completion rate
      const totalAssignments = studentProfile.assignmentHistory.length;
      studentProfile.engagementMetrics.completionRate = Math.round((totalAssignments / (totalAssignments + 1)) * 100);
    }

    // Save updated profile
    await profilesCollection.updateOne(
      { studentId },
      {
        $set: {
          subjectMastery: studentProfile.subjectMastery,
          assignmentHistory: studentProfile.assignmentHistory,
          engagementMetrics: studentProfile.engagementMetrics,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✓ Updated mastery for ${studentId}: ${topic} ${previousMastery}% → ${newMastery}%`);

    return {
      masteryUpdated: true,
      previousMastery,
      newMastery,
      weaknessesIdentified,
      improvementFromPrevious: improvement,
      badgesEarned
    };
  } catch (error) {
    console.error('Error updating student mastery:', error);
    return {
      masteryUpdated: false,
      previousMastery: 0,
      newMastery: 0,
      weaknessesIdentified: [],
      improvementFromPrevious: 0,
      badgesEarned: []
    };
  }
}

/**
 * Update class-wide analytics after grading
 */
export async function updateClassAnalytics(
  classId: string,
  assignment: Assignment,
  allSubmissions: Submission[]
) {
  try {
    const analyticsCollection = await getCollection(COLLECTIONS.ANALYTICS);
    
    // Calculate class statistics
    const gradedSubmissions = allSubmissions.filter(s => s.processed && s.grade);
    const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0);
    const averageScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
    const highestScore = Math.max(...gradedSubmissions.map(s => s.grade?.score || 0));
    const lowestScore = Math.min(...gradedSubmissions.map(s => s.grade?.score || 0));
    
    // Count struggling and excelling students
    const strugglingCount = gradedSubmissions.filter(s => (s.grade?.score || 0) < (assignment.maxScore || 100) * 0.6).length;
    const excellingCount = gradedSubmissions.filter(s => (s.grade?.score || 0) >= (assignment.maxScore || 100) * 0.85).length;
    
    // Extract common errors
    const allErrors: string[] = [];
    gradedSubmissions.forEach(s => {
      if (s.autoGrade?.errorAnalysis) {
        allErrors.push(...s.autoGrade.errorAnalysis.map((e: any) => e.errorType || e.description));
      }
    });
    
    const errorFrequency = allErrors.reduce((acc, error) => {
      acc[error] = (acc[error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonErrors = Object.entries(errorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error);
    
    // Update or create analytics entry
    const topicPerformance = {
      topic: assignment.topic || 'General',
      assignmentsGiven: 1,
      averageScore,
      highestScore,
      lowestScore,
      studentsStruggling: strugglingCount,
      studentsExcelling: excellingCount,
      percentageStruggling: (strugglingCount / gradedSubmissions.length) * 100,
      percentageExcelling: (excellingCount / gradedSubmissions.length) * 100,
      mostCommonErrors
    };
    
    const gradingEfficiency = {
      totalSubmissionsGraded: gradedSubmissions.length,
      aiGradedCount: gradedSubmissions.filter(s => s.grade?.gradedBy?.includes('AI')).length,
      teacherGradedCount: gradedSubmissions.filter(s => s.grade?.gradedBy === 'teacher').length,
      averageGradingTime: 90, // seconds (AI grading)
      teacherTimeSaved: (gradedSubmissions.length * (12 * 60 - 90)) / 3600, // hours saved
      aiAccuracyRate: 85 // Placeholder
    };
    
    console.log(`✓ Updated class analytics for ${classId}: Topic "${assignment.topic}", Avg Score: ${averageScore.toFixed(1)}`);
    
    return {
      topicPerformance,
      gradingEfficiency
    };
  } catch (error) {
    console.error('Error updating class analytics:', error);
    return null;
  }
}

/**
 * Generate improvement recommendations based on mastery data
 */
export function generateRecommendations(studentProfile: StudentProfile): string[] {
  const recommendations: string[] = [];
  
  if (!studentProfile.subjectMastery) return recommendations;
  
  for (const subjectData of studentProfile.subjectMastery) {
    for (const topic of subjectData.topics) {
      if (topic.masteryScore < 50) {
        recommendations.push(`Focus on ${topic.name} - current mastery: ${topic.masteryScore}%`);
      }
      
      if (topic.weaknesses.length > 0) {
        recommendations.push(`Review ${topic.weaknesses.join(', ')} in ${topic.name}`);
      }
      
      if (topic.consecutiveHighScores >= 2 && topic.masteryScore < 90) {
        recommendations.push(`Great progress in ${topic.name}! Try advanced problems to reach excellence.`);
      }
    }
    
    if (subjectData.overallMasteryScore < 60) {
      recommendations.push(`Consider additional practice in ${subjectData.subject} (Grade ${subjectData.grade})`);
    }
  }
  
  return recommendations.slice(0, 5); // Top 5 recommendations
}

export default {
  updateStudentMastery,
  updateClassAnalytics,
  generateRecommendations
};
