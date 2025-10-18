"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, CheckCircle, AlertCircle, Brain, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentSelector from './StudentSelector';

interface Question {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'long_answer' | 'numerical' | 'essay' | 'true_false';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
}

interface TeacherAssignmentCreatorProps {
  classId: string;
  teacherId: string;
  subject: string;
  grade: string;
  teacherSchoolId?: string;
  onComplete: (assignmentId: string, questionSetId: string) => void;
  onCancel?: () => void;
}

interface SelectedStudent {
  id: string;
  name: string;
  userId: string; // User ID from new system
  isSelected: boolean;
}

export default function TeacherAssignmentCreator({
  classId,
  teacherId,
  subject,
  grade,
  teacherSchoolId,
  onComplete,
  onCancel
}: TeacherAssignmentCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', questionText: '', questionType: 'short_answer', points: 10 }
  ]);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [questionsToAttempt, setQuestionsToAttempt] = useState(5);
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [personalizationLevel, setPersonalizationLevel] = useState<'light' | 'moderate' | 'aggressive'>('moderate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  // Student/Class selection
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classId);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  const addQuestion = () => {
    const newId = `q${questions.length + 1}`;
    setQuestions([
      ...questions,
      { id: newId, questionText: '', questionType: 'short_answer', points: 10 }
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    } else {
      toast.error('You must have at least one question');
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const options = question.options || [];
      updateQuestion(questionId, 'options', [...options, '']);
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, 'options', newOptions);
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, 'options', newOptions);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Please enter an assignment title');
      return false;
    }

    if (questions.length === 0) {
      toast.error('Please add at least 1 question');
      return false;
    }

    if (questionsToAttempt < 1) {
      toast.error('Students must attempt at least 1 question');
      return false;
    }

    if (questions.length < questionsToAttempt) {
      toast.error(`You need at least ${questionsToAttempt} questions (students will choose ${questionsToAttempt} to attempt)`);
      return false;
    }

    const emptyQuestions = questions.filter(q => !q.questionText.trim());
    if (emptyQuestions.length > 0) {
      toast.error('Please fill in all question texts');
      return false;
    }

    const mcqQuestions = questions.filter(q => q.questionType === 'mcq');
    for (const mcq of mcqQuestions) {
      if (!mcq.options || mcq.options.length < 2) {
        toast.error('MCQ questions need at least 2 options');
        return false;
      }
      if (mcq.options.some(opt => !opt.trim())) {
        toast.error('Please fill in all MCQ options');
        return false;
      }
    }

    if (!submissionDeadline) {
      toast.error('Please set a submission deadline');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setIsAnalyzing(true);

    try {
      // Step 1: Create assignment (assuming you have an assignments API)
      const assignmentId = `assign_${Date.now()}`;

      // Step 2: Create question set with AI analysis
      const response = await fetch('/api/assignments/create-with-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          teacherId,
          classId,
          subject,
          topic: topic || subject,
          title,
          description,
          schoolId: teacherSchoolId,
          selectedStudents: selectedStudents.map(s => s.userId),
          grade,
          questions: questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points
          })),
          assignmentRules: {
            totalQuestions: questions.length,
            questionsToAttempt,
            allowStudentChoice: true,
            submissionDeadline
          },
          personalizationEnabled: true,
          personalizationLevel
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create assignment');
      }

      setAnalysisResults(data.summary);
      setIsAnalyzing(false);

      toast.success('Assignment created and analyzed successfully!');
      
      // Wait a moment to show analysis results
      setTimeout(() => {
        onComplete(assignmentId, data.questionSetId);
      }, 2000);

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create assignment');
      setIsAnalyzing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Assignment</h1>
          <p className="text-gray-600">Add any number of questions. Students will choose which ones to attempt. Each question is personalized using AI.</p>
        </div>

        {/* Assignment Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Algebra Quiz 1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Linear Equations"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Questions to Attempt *</label>
              <input
                type="number"
                value={questionsToAttempt}
                onChange={(e) => setQuestionsToAttempt(parseInt(e.target.value))}
                min="1"
                max={questions.length || 1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {questions.length > 0 
                  ? `Students will choose ${questionsToAttempt} out of ${questions.length} questions to attempt`
                  : 'Add questions below, then set how many students must attempt'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Submission Deadline *</label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personalization Level</label>
            <div className="flex space-x-2">
              {(['light', 'moderate', 'aggressive'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPersonalizationLevel(level)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    personalizationLevel === level
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {personalizationLevel === 'light' && 'Minimal modifications, preserves original structure'}
              {personalizationLevel === 'moderate' && 'Balanced personalization with scaffolding'}
              {personalizationLevel === 'aggressive' && 'Maximum personalization, extensive support'}
            </p>
          </div>

          {/* Student Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Students *
            </label>
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              {selectedStudents.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudents.length >= 20 ? (
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Entire Class Selected</p>
                        <p className="text-xs text-gray-500">All {selectedStudents.length} students will receive this assignment</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Selected {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}:
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {selectedStudents.map((student) => (
                          <span
                            key={student.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                          >
                            {student.name}
                            <button
                              type="button"
                              onClick={() => setSelectedStudents(prev => prev.filter(s => s.id !== student.id))}
                              className="ml-2 text-emerald-600 hover:text-emerald-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowStudentSelector(true)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      + Modify selection
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudents([])}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    No students selected. Assignment will be sent to all students in the class.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowStudentSelector(true)}
                    className="inline-flex items-center px-4 py-2 border border-emerald-300 text-sm font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Select Students
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Questions ({questions.length})</h2>
            <button
              onClick={addQuestion}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question Type *</label>
                      <select
                        value={question.questionType}
                        onChange={(e) => updateQuestion(question.id, 'questionType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="long_answer">Long Answer</option>
                        <option value="numerical">Numerical</option>
                        <option value="essay">Essay</option>
                        <option value="true_false">True/False</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {question.questionType === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      <div className="space-y-2">
                        {(question.options || ['']).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">{String.fromCharCode(65 + optIndex)}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                            {(question.options?.length || 0) > 2 && (
                              <button
                                onClick={() => removeOption(question.id, optIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(question.id)}
                          className="text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ml-auto flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isAnalyzing ? 'Analyzing Questions...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Create & Analyze with AI</span>
                </>
              )}
            </button>
          </div>

          {analysisResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900">AI Analysis Complete!</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Easy:</span>
                  <span className="ml-2 font-semibold text-gray-900">{analysisResults.difficultyDistribution.easy}</span>
                </div>
                <div>
                  <span className="text-gray-600">Medium:</span>
                  <span className="ml-2 font-semibold text-gray-900">{analysisResults.difficultyDistribution.medium}</span>
                </div>
                <div>
                  <span className="text-gray-600">Hard:</span>
                  <span className="ml-2 font-semibold text-gray-900">{analysisResults.difficultyDistribution.hard}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Avg Bloom's Level: {analysisResults.averageBloomsLevel} | Personalization: {personalizationLevel}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Student Selector Modal */}
      {showStudentSelector && (
        <StudentSelector
          onStudentsSelected={(students, selectedClass) => {
            // Map Student[] to SelectedStudent[] (id is actually studentId)
            const mapped = students
              .filter(s => s.isSelected)
              .map(s => ({
                id: s.id,
                name: s.name,
                userId: s.id, // In StudentSelector, id IS the studentId
                isSelected: s.isSelected
              }));
            setSelectedStudents(mapped);
            if (selectedClass) {
              setSelectedClassId(selectedClass._id);
            }
            setShowStudentSelector(false);
            toast.success(`Selected ${mapped.length} students`);
          }}
          onClose={() => setShowStudentSelector(false)}
          classId={selectedClassId}
          teacherId={teacherId}
          teacherRole="teacher"
          teacherSchoolId={teacherSchoolId || ''}
        />
      )}
    </div>
  );
}

