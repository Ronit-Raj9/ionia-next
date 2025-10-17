"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, PlayCircle, FileText, TrendingUp } from 'lucide-react';
import AssignmentWorkflow from './AssignmentWorkflow';

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  topic: string;
  deadline: Date;
  totalQuestions: number;
  questionsToAttempt: number;
  status: 'available' | 'in_progress' | 'submitted';
  score?: number;
}

interface StudentAssignmentViewProps {
  studentId: string;
  classId: string;
}

export default function StudentAssignmentView({
  studentId,
  classId
}: StudentAssignmentViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [studentId, classId]);

  const fetchAssignments = async () => {
    // This would fetch from your assignments API
    // For now, using mock data
    setLoading(false);
    
    // Mock assignments
    setAssignments([
      {
        _id: 'assign_1',
        title: 'Algebra Quiz 1',
        subject: 'Mathematics',
        topic: 'Linear Equations',
        deadline: new Date('2025-10-25'),
        totalQuestions: 10,
        questionsToAttempt: 5,
        status: 'available'
      }
    ]);
  };

  const handleStartAssignment = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
  };

  const handleAssignmentComplete = () => {
    setSelectedAssignment(null);
    fetchAssignments(); // Refresh list
  };

  if (selectedAssignment) {
    return (
      <AssignmentWorkflow
        assignmentId={selectedAssignment}
        studentId={studentId}
        classId={classId}
        onComplete={handleAssignmentComplete}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Assignments</h1>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h2>
            <p className="text-gray-600">Check back later for new assignments from your teacher</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assignment.status === 'submitted'
                      ? 'bg-green-100 text-green-700'
                      : assignment.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {assignment.status === 'submitted' ? 'Submitted' :
                     assignment.status === 'in_progress' ? 'In Progress' : 'Available'}
                  </span>
                  
                  {assignment.status === 'submitted' && assignment.score !== undefined && (
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">{assignment.score}%</span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{assignment.subject} • {assignment.topic}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Choose {assignment.questionsToAttempt} out of {assignment.totalQuestions} questions
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                </div>

                {assignment.status === 'available' && (
                  <button
                    onClick={() => handleStartAssignment(assignment._id)}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Assignment</span>
                  </button>
                )}

                {assignment.status === 'in_progress' && (
                  <button
                    onClick={() => handleStartAssignment(assignment._id)}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Continue</span>
                  </button>
                )}

                {assignment.status === 'submitted' && (
                  <button
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>View Results</span>
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

