import {Question} from '../models/question.model.js';
import {User} from '../models/user.model.js';

export const getAdminAnalytics = async (req, res) => {
  try {
    console.log("🔍 Analytics request received from:", req.user?.email || "Unknown user");
    console.log("👤 User role:", req.user?.role || "No role found");
    
    // Get total questions count
    const totalQuestions = await Question.countDocuments() || 0;
    console.log("📊 Total questions:", totalQuestions);

    // Get active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: thirtyDaysAgo }
    }) || 0;
    console.log("📊 Active users:", activeUsers);

    // Get total students
    const totalStudents = await User.countDocuments({ role: 'user' }) || 0;
    console.log("📊 Total students:", totalStudents);

    // Get questions by subject
    const questionsBySubject = await Question.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      }
    ]) || [];
    // console.log("📊 Questions by subject:", JSON.stringify(questionsBySubject)); // Optional log

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
      
    // === DEBUG LOGGING START ===
    console.log("\n--- DEBUG: Raw Recent Questions Data ---");
    console.log(JSON.stringify(recentQuestions, null, 2)); 
    console.log("--- DEBUG: End Raw Data ---\n");
    // === DEBUG LOGGING END ===

    const formattedRecentQuestions = recentQuestions.map(question => {
      // === DEBUG LOGGING START ===
      console.log(`---> Mapping Question ID: ${question._id}`);
      console.log(`     Field 'text':`, question.text); 
      console.log(`     Field 'questionText':`, question.questionText); // Check other potential fields
      console.log(`     Field 'content':`, question.content);       // Check other potential fields
      // === DEBUG LOGGING END ===
      return {
        id: question._id?.toString() || '',
        // Use the correct field for the title - CHECK THE LOGS
        title: question.text || question.questionText || question.content || 'Untitled Question', 
        subject: question.subject || 'Unknown Subject',
        createdAt: question.createdAt || new Date()
      }
    });

    // Add dummy data for testing (since there's no totalTests or recentTests in the model)
    const responseData = {
      totalTests: 0, // Placeholder since not in backend data
      totalQuestions,
      activeUsers,
      totalStudents,
      testsBySubject,
      completionRates: {}, // Placeholder since not in backend data
      recentTests: [], // Placeholder since not in backend data
      recentQuestions: formattedRecentQuestions
    };

    console.log("✅ Sending analytics response."); // Simplified log
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      details: error.message 
    });
  }
}; 