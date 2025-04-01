import {Question} from '../models/question.model.js';
import {User} from '../models/user.model.js';

export const getAdminAnalytics = async (req, res) => {
  try {
    // Get total questions count
    const totalQuestions = await Question.countDocuments() || 0;

    // Get active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: thirtyDaysAgo }
    }) || 0;

    // Get total students
    const totalStudents = await User.countDocuments({ role: 'user' }) || 0;

    // Get questions by subject
    const questionsBySubject = await Question.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      }
    ]) || [];

    const testsBySubject = {};
    questionsBySubject.forEach(item => {
      if (item._id) {
        testsBySubject[item._id] = item.count || 0;
      }
    });

    // Get recent questions
    const recentQuestions = await Question.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean() || [];

    const formattedRecentQuestions = recentQuestions.map(question => ({
      id: question._id?.toString() || '',
      title: question.text || 'Untitled Question',
      subject: question.subject || 'Unknown Subject',
      createdAt: question.createdAt || new Date()
    }));

    res.json({
      totalQuestions,
      activeUsers,
      totalStudents,
      testsBySubject,
      recentQuestions: formattedRecentQuestions
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      details: error.message 
    });
  }
}; 