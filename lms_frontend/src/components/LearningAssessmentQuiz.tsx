"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  learningAssessmentQuestions,
  calculateOnboardingMetrics,
  generateInitialDynamicMetrics,
  calculateInitialZPDMetrics,
  generateLearningInsights,
  recommendStartingDifficulty,
  recommendStartingBloomsLevel
} from '@/lib/learningAssessmentQuestions';

interface LearningAssessmentQuizProps {
  studentId: string;
  classId: string;
  grade: string;
  onComplete: (profile: any) => void;
  onSkip?: () => void;
  isEmbedded?: boolean;
}

const metricIcons: Record<string, React.ReactNode> = {
  cognitive_depth_preference: <Brain className="w-5 h-5" />,
  challenge_resilience: <Target className="w-5 h-5" />,
  subject_affinity_map: <BookOpen className="w-5 h-5" />,
  learning_pace_self_assessment: <TrendingUp className="w-5 h-5" />,
  help_seeking_tendency: <MessageCircle className="w-5 h-5" />
};

const metricTitles: Record<string, string> = {
  cognitive_depth_preference: 'Learning Depth',
  challenge_resilience: 'Challenge Response',
  subject_affinity_map: 'Subject Interests',
  learning_pace_self_assessment: 'Learning Pace',
  help_seeking_tendency: 'Help-Seeking'
};

export default function LearningAssessmentQuiz({ 
  studentId,
  classId,
  grade,
  onComplete, 
  onSkip, 
  isEmbedded = false 
}: LearningAssessmentQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, number | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const currentQ = learningAssessmentQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / learningAssessmentQuestions.length) * 100;
  const isLastQuestion = currentQuestion === learningAssessmentQuestions.length - 1;

  const handleResponse = (value: number | string) => {
    if (currentQ.type === 'multi_choice') {
      // Handle multi-select
      const currentSelections = (responses[currentQ.id] as string[]) || [];
      const valueStr = String(value);
      
      if (currentSelections.includes(valueStr)) {
        // Remove if already selected
        setResponses(prev => ({
          ...prev,
          [currentQ.id]: currentSelections.filter(v => v !== valueStr)
        }));
      } else {
        // Add to selections
        setResponses(prev => ({
          ...prev,
          [currentQ.id]: [...currentSelections, valueStr]
        }));
      }
    } else {
      // Single select
      setResponses(prev => ({
        ...prev,
        [currentQ.id]: value as number
      }));
    }
  };

  const handleNext = () => {
    const response = responses[currentQ.id];
    if (!response || 
        (Array.isArray(response) && response.length === 0)) {
      toast.error('Please select at least one option before continuing');
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Calculate metrics
      const onboardingMetrics = calculateOnboardingMetrics(responses);
      const dynamicMetrics = generateInitialDynamicMetrics(onboardingMetrics);
      const zpdMetrics = calculateInitialZPDMetrics(onboardingMetrics);
      const insights = generateLearningInsights(onboardingMetrics);
      const startingDifficulty = recommendStartingDifficulty(onboardingMetrics);
      const startingBloomsLevel = recommendStartingBloomsLevel(onboardingMetrics);
      
      const fullProfile = {
        studentId,
        classId,
        grade,
        subjects: Object.keys(onboardingMetrics.subject_affinity_map).filter(
          key => onboardingMetrics.subject_affinity_map[key] > 0
        ),
        onboardingMetrics,
        dynamicMetrics,
        zpdMetrics,
        engagementMetrics: {
          session_frequency: 0,
          avg_session_duration: 0,
          consecutive_days: 0,
          progress_velocity: 0,
          last_activity: new Date()
        },
        behavioralPatterns: {
          preferred_question_types: [],
          hint_usage_frequency: 0,
          confidence_accuracy_correlation: 0,
          growth_trajectory: 'steady' as const
        },
        subjectPerformance: [],
        questionHistory: [],
        aiRecommendations: {
          nextQuestions: [],
          remedialTopics: [],
          enrichmentActivities: [],
          lastGenerated: new Date()
        },
        insights,
        startingDifficulty,
        startingBloomsLevel,
        status: 'active',
        onboardingCompleted: true,
        lastAssessment: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setProfile(fullProfile);
      
      // Save to database
      const response = await fetch('/api/learning-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullProfile),
      });

      if (response.ok) {
        setShowResult(true);
        toast.success('Your learning profile has been created! 🎉');
        
        // Call onComplete after showing results
        setTimeout(() => {
          onComplete(fullProfile);
        }, 4000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving learning profile:', error);
      toast.error('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult && profile) {
    const { onboardingMetrics, insights, startingDifficulty, startingBloomsLevel } = profile;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${isEmbedded ? 'p-4' : 'min-h-screen'} bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center`}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Learning Profile Complete! 🎉
            </h2>
            <p className="text-gray-600">
              Questions will now be personalized based on your unique learning style
            </p>
          </motion.div>

          {/* Onboarding Metrics Visualization */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Learning Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(onboardingMetrics)
                .filter(([key]) => key !== 'subject_affinity_map' && key !== 'assessed_at')
                .map(([metric, value], index) => (
                <motion.div
                  key={metric}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-lg p-4 border border-emerald-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        {metricIcons[metric]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{metricTitles[metric]}</h4>
                        <p className="text-xs text-gray-600">Level {String(value)}/5</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{Number(value) * 20}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Number(value) * 20}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className={`h-2 rounded-full ${
                        Number(value) >= 4 ? 'bg-green-500' :
                        Number(value) >= 3 ? 'bg-emerald-500' :
                        'bg-yellow-500'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Subject Interests */}
          <div className="bg-gradient-to-r from-emerald-50 to-pink-50 rounded-xl p-6 mb-6 border border-emerald-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Subject Interests</h3>
                <p className="text-sm text-gray-600">Topics you're most excited about</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(onboardingMetrics.subject_affinity_map)
                .filter(([_, score]) => (score as number) > 0)
                .map(([subject, score]) => (
                  <span 
                    key={subject}
                    className="px-3 py-1 bg-white rounded-full text-sm font-medium text-emerald-700 border border-emerald-200"
                  >
                    {subject.replace('_', ' ').toUpperCase()} ({String(score)}/10)
                  </span>
                ))}
            </div>
          </div>

          {/* Learning Insights */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Learning Style</h3>
                <p className="text-sm text-gray-600">
                  Starting Difficulty: <strong className="text-emerald-700">{startingDifficulty.toUpperCase()}</strong> | 
                  Bloom's Level: <strong className="text-emerald-700">{startingBloomsLevel}/6</strong>
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {insights.map((insight: string, idx: number) => (
                <li key={idx} className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What Happens Next */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h4 className="font-semibold text-gray-900 mb-3">What Happens Next:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Questions will be <strong>automatically adjusted</strong> to your optimal difficulty level</span>
              </li>
              <li className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Your <strong>learning pace</strong> will be tracked and adapted in real-time</span>
              </li>
              <li className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>You'll receive <strong>personalized recommendations</strong> based on your progress</span>
              </li>
              <li className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Your teacher will see <strong>insights</strong> to better support your learning</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-500 h-2 rounded-full"
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to your dashboard in 4 seconds...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${isEmbedded ? 'p-4' : 'min-h-screen'} bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center py-8`}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Brain className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Adaptive Learning Assessment
          </h1>
          <p className="text-gray-600 mb-2">
            Answer these 5 questions to personalize your learning experience
          </p>
          <p className="text-sm text-gray-500">
            Research-based questions to understand how you learn best
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 mt-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-500 h-3 rounded-full"
            />
          </div>
          <p className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {learningAssessmentQuestions.length}
          </p>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            {/* Metric Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                {metricIcons[currentQ.metric]}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {metricTitles[currentQ.metric]}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 text-center">
              {currentQ.question}
            </h2>
            
            {currentQ.description && (
              <p className="text-center text-gray-600 text-sm mb-6">
                {currentQ.description}
              </p>
            )}

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = currentQ.type === 'multi_choice'
                  ? (responses[currentQ.id] as string[])?.includes(String(option.value))
                  : responses[currentQ.id] === option.value;

                return (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleResponse(option.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-102 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-102'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {option.emoji && (
                          <span className="text-2xl">{option.emoji}</span>
                        )}
                        <div className="flex-1">
                          <span className={`font-medium block ${
                            isSelected ? 'text-emerald-700' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="text-xs text-gray-500 block mt-1">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Research Basis */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Research Basis:</strong> {currentQ.researchBasis}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip for Now
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={
                (() => {
                  const resp = responses[currentQ.id];
                  return !resp || (Array.isArray(resp) && resp.length === 0) || isSubmitting;
                })()
              }
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLastQuestion ? (
                <>
                  <span>Complete Assessment</span>
                  <CheckCircle className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

