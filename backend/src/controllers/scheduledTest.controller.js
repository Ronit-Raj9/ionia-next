import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ScheduledTest } from "../models/scheduledTest.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new scheduled test (admin only)
const createScheduledTest = asyncHandler(async (req, res) => {
  const { title, description, examType, subject, scheduledDate, duration, testId } = req.body;
  
  // Validate required fields
  if (!title || !examType || !subject || !scheduledDate || !duration) {
    throw new ApiError(400, "All required fields must be provided");
  }
  
  try {
    const newScheduledTest = new ScheduledTest({
      title,
      description,
      examType,
      subject,
      scheduledDate: new Date(scheduledDate),
      duration,
      testId,
      createdBy: req.user._id
    });
    
    await newScheduledTest.save();
    
    return res.status(201).json(
      new ApiResponse(201, newScheduledTest, "Scheduled test created successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error creating scheduled test", error.message);
  }
});

// Get upcoming tests for a user
const getUpcomingTests = asyncHandler(async (req, res) => {
  try {
    // Get current date
    const currentDate = new Date();
    
    // Find all active tests scheduled for today or in the future
    const upcomingTests = await ScheduledTest.find({
      scheduledDate: { $gte: currentDate },
      isActive: true
    }).sort({ scheduledDate: 1 }).limit(10);
    
    // Format the response
    const formattedTests = upcomingTests.map(test => ({
      id: test._id,
      testName: test.title,
      date: test.scheduledDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      examType: test.examType,
      subject: test.subject,
      duration: test.duration
    }));
    
    return res.status(200).json(
      new ApiResponse(200, formattedTests, "Upcoming tests fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching upcoming tests", error.message);
  }
});

// Update a scheduled test (admin only)
const updateScheduledTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const updatedTest = await ScheduledTest.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    
    if (!updatedTest) {
      throw new ApiError(404, "Scheduled test not found");
    }
    
    return res.status(200).json(
      new ApiResponse(200, updatedTest, "Scheduled test updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error updating scheduled test", error.message);
  }
});

// Delete a scheduled test (admin only)
const deleteScheduledTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const deletedTest = await ScheduledTest.findByIdAndDelete(id);
    
    if (!deletedTest) {
      throw new ApiError(404, "Scheduled test not found");
    }
    
    return res.status(200).json(
      new ApiResponse(200, deletedTest, "Scheduled test deleted successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error deleting scheduled test", error.message);
  }
});

export {
  createScheduledTest,
  getUpcomingTests,
  updateScheduledTest,
  deleteScheduledTest
}; 