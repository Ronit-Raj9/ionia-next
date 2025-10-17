"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertCircle, CheckCircle, Brain, Target } from 'lucide-react';

interface ChoiceAnalytics {
  studentId: string;
  studentName: string;
  choiceQuality: number;
  confidenceScore: number;
  strategicThinking: number;
  selfAwareness: number;
  patterns: {
    riskAverse: boolean;
    challengeSeeker: boolean;
    avoidsHighBloomsLevel: boolean;
  };
  avoidedTopics: string[];
  needsIntervention: boolean;
}

interface TeacherAnalyticsDashboardProps {
  assignmentId: string;
  classId: string;
}

export default function TeacherAnalyticsDashboard({
  assignmentId,
  classId
}: TeacherAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ChoiceAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [assignmentId, classId]);

  const fetchAnalytics = async () => {
    // Mock data for demonstration
    setLoading(false);
    setAnalytics([
      {
        studentId: 'student_001',
        studentName: 'Alice Johnson',
        choiceQuality: 85,
        confidenceScore: 78,
        strategicThinking: 90,
        selfAwareness: 82,
        patterns: {
          riskAverse: false,
          challengeSeeker: true,
          avoidsHighBloomsLevel: false
        },
        avoidedTopics: [],
        needsIntervention: false
      },
      {
        studentId: 'student_002',
        studentName: 'Bob Smith',
        choiceQuality: 45,
        confidenceScore: 35,
        strategicThinking: 40,
        selfAwareness: 50,
        patterns: {
          riskAverse: true,
          challengeSeeker: false,
          avoidsHighBloomsLevel: true
        },
        avoidedTopics: ['Abstract Concepts', 'Word Problems'],
        needsIntervention: true
      }
    ]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const classAverage = analytics.reduce((sum, a) => sum + a.choiceQuality, 0) / analytics.length;
  const studentsNeedingHelp = analytics.filter(a => a.needsIntervention).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Student Choice Analytics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{analytics.length}</span>
            </div>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{Math.round(classAverage)}</span>
            </div>
            <p className="text-sm text-gray-600">Avg Choice Quality</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-gray-900">{studentsNeedingHelp}</span>
            </div>
            <p className="text-sm text-gray-600">Need Intervention</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <span className="text-3xl font-bold text-gray-900">{analytics.length - studentsNeedingHelp}</span>
            </div>
            <p className="text-sm text-gray-600">On Track</p>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Insights</h2>
          
          <div className="space-y-4">
            {analytics.map((student, index) => (
              <motion.div
                key={student.studentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border-2 rounded-lg p-4 ${
                  student.needsIntervention ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {student.studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.studentName}</h3>
                      {student.needsIntervention && (
                        <span className="text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Needs attention
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-lg font-bold ${getScoreColor(student.choiceQuality)}`}>
                    {student.choiceQuality}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Confidence</div>
                    <div className={`text-lg font-bold ${getScoreColor(student.confidenceScore)}`}>
                      {student.confidenceScore}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Strategic</div>
                    <div className={`text-lg font-bold ${getScoreColor(student.strategicThinking)}`}>
                      {student.strategicThinking}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Self-Aware</div>
                    <div className={`text-lg font-bold ${getScoreColor(student.selfAwareness)}`}>
                      {student.selfAwareness}
                    </div>
                  </div>
                </div>

                {/* Patterns */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {student.patterns.riskAverse && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      😟 Risk Averse
                    </span>
                  )}
                  {student.patterns.challengeSeeker && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      🔥 Challenge Seeker
                    </span>
                  )}
                  {student.patterns.avoidsHighBloomsLevel && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      🧠 Avoids Complex Questions
                    </span>
                  )}
                </div>

                {/* Avoided Topics */}
                {student.avoidedTopics.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Avoided:</span>{' '}
                    {student.avoidedTopics.join(', ')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

