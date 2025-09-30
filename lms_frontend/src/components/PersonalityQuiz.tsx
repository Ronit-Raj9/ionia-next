"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Eye, 
  Users, 
  BookOpen, 
  Lightbulb, 
  Target,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[];
  category: 'learning_style' | 'problem_solving' | 'collaboration' | 'motivation' | 'feedback';
}

interface QuizResult {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'analytical';
  problemSolving: 'step_by_step' | 'intuitive' | 'collaborative' | 'independent';
  collaboration: 'high' | 'medium' | 'low';
  motivation: 'achievement' | 'mastery' | 'social' | 'autonomy';
  feedback: 'immediate' | 'detailed' | 'encouraging' | 'constructive';
}

interface PersonalityQuizProps {
  studentId: string;
  onComplete: (result: QuizResult) => void;
  onSkip?: () => void;
  isEmbedded?: boolean;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'learning_style',
    question: 'How do you prefer to learn new math concepts?',
    category: 'learning_style',
    options: [
      {
        value: 'visual',
        label: 'Visual Learning',
        description: 'I learn best with diagrams, charts, and visual representations',
        icon: <Eye className="w-6 h-6" />
      },
      {
        value: 'auditory',
        label: 'Auditory Learning',
        description: 'I understand better when I hear explanations and can discuss concepts',
        icon: <Users className="w-6 h-6" />
      },
      {
        value: 'kinesthetic',
        label: 'Hands-on Learning',
        description: 'I learn by doing, using physical objects or interactive methods',
        icon: <Target className="w-6 h-6" />
      },
      {
        value: 'reading',
        label: 'Reading & Writing',
        description: 'I prefer written explanations and taking detailed notes',
        icon: <BookOpen className="w-6 h-6" />
      }
    ]
  },
  {
    id: 'problem_solving',
    question: 'When solving math problems, you prefer to:',
    category: 'problem_solving',
    options: [
      {
        value: 'step_by_step',
        label: 'Follow a Method',
        description: 'I like clear step-by-step procedures and structured approaches',
        icon: <ArrowRight className="w-6 h-6" />
      },
      {
        value: 'intuitive',
        label: 'Use Intuition',
        description: 'I trust my instincts and often see patterns quickly',
        icon: <Lightbulb className="w-6 h-6" />
      },
      {
        value: 'collaborative',
        label: 'Work with Others',
        description: 'I solve problems better when discussing with classmates or teachers',
        icon: <Users className="w-6 h-6" />
      },
      {
        value: 'independent',
        label: 'Think Alone',
        description: 'I prefer to work through problems independently and quietly',
        icon: <Brain className="w-6 h-6" />
      }
    ]
  },
  {
    id: 'collaboration',
    question: 'How do you prefer to work on assignments?',
    category: 'collaboration',
    options: [
      {
        value: 'high',
        label: 'Group Work',
        description: 'I love working in teams and bouncing ideas off others',
        icon: <Users className="w-6 h-6" />
      },
      {
        value: 'medium',
        label: 'Mixed Approach',
        description: 'I like both individual work and occasional group activities',
        icon: <Target className="w-6 h-6" />
      },
      {
        value: 'low',
        label: 'Independent Work',
        description: 'I prefer to work alone and focus on my own pace',
        icon: <BookOpen className="w-6 h-6" />
      }
    ]
  },
  {
    id: 'motivation',
    question: 'What motivates you most in learning?',
    category: 'motivation',
    options: [
      {
        value: 'achievement',
        label: 'High Scores',
        description: 'I am motivated by getting good grades and high scores',
        icon: <Target className="w-6 h-6" />
      },
      {
        value: 'mastery',
        label: 'Understanding',
        description: 'I want to truly understand concepts, not just get the right answer',
        icon: <Brain className="w-6 h-6" />
      },
      {
        value: 'social',
        label: 'Recognition',
        description: 'I am motivated by praise from teachers and recognition from peers',
        icon: <Users className="w-6 h-6" />
      },
      {
        value: 'autonomy',
        label: 'Self-Direction',
        description: 'I like having control over my learning pace and methods',
        icon: <ArrowRight className="w-6 h-6" />
      }
    ]
  },
  {
    id: 'feedback',
    question: 'What type of feedback helps you most?',
    category: 'feedback',
    options: [
      {
        value: 'immediate',
        label: 'Instant Feedback',
        description: 'I want to know right away if I am on the right track',
        icon: <CheckCircle className="w-6 h-6" />
      },
      {
        value: 'detailed',
        label: 'Detailed Explanations',
        description: 'I need thorough explanations of what I did wrong and why',
        icon: <BookOpen className="w-6 h-6" />
      },
      {
        value: 'encouraging',
        label: 'Positive Reinforcement',
        description: 'I respond best to encouraging and supportive feedback',
        icon: <Lightbulb className="w-6 h-6" />
      },
      {
        value: 'constructive',
        label: 'Constructive Criticism',
        description: 'I prefer direct, honest feedback that helps me improve',
        icon: <Target className="w-6 h-6" />
      }
    ]
  }
];

export default function PersonalityQuiz({ 
  studentId, 
  onComplete, 
  onSkip, 
  isEmbedded = false 
}: PersonalityQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const currentQ = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
    
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }, 500);
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResult = (): QuizResult => {
    return {
      learningStyle: answers.learning_style as any || 'visual',
      problemSolving: answers.problem_solving as any || 'step_by_step',
      collaboration: answers.collaboration as any || 'medium',
      motivation: answers.motivation as any || 'mastery',
      feedback: answers.feedback as any || 'detailed'
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const result = calculateResult();
      
      // Update student profile in database
      const response = await fetch('/api/student-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          personalityProfile: {
            type: result.learningStyle,
            quizResponses: Object.values(answers),
            problemSolving: result.problemSolving,
            collaboration: result.collaboration,
            motivation: result.motivation,
            feedback: result.feedback
          }
        }),
      });

      if (response.ok) {
        setShowResult(true);
        toast.success('Personality profile updated successfully!');
        
        // Call onComplete after a delay to show result
        setTimeout(() => {
          onComplete(result);
        }, 2000);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPersonalityDescription = (result: QuizResult) => {
    const descriptions = {
      visual: "You're a visual learner who benefits from diagrams, charts, and visual representations.",
      auditory: "You're an auditory learner who understands better through listening and discussion.",
      kinesthetic: "You're a hands-on learner who learns best by doing and interacting.",
      reading: "You're a reading/writing learner who prefers written explanations and detailed notes.",
      analytical: "You're an analytical learner who likes structured, logical approaches."
    };
    
    return descriptions[result.learningStyle] || descriptions.visual;
  };

  if (showResult) {
    const result = calculateResult();
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${isEmbedded ? 'p-4' : 'min-h-screen'} bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center`}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quiz Complete! 🎉
            </h2>
            <p className="text-gray-600">
              Your learning profile has been created successfully
            </p>
          </motion.div>

          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Learning Profile
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {result.learningStyle} Learner
                  </p>
                  <p className="text-sm text-gray-600">
                    {getPersonalityDescription(result)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Problem Solving:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {result.problemSolving.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Collaboration:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {result.collaboration}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Motivation:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {result.motivation}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Feedback:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {result.feedback}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Your assignments will now be personalized based on this profile!
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1 }}
                className="bg-emerald-500 h-2 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${isEmbedded ? 'p-4' : 'min-h-screen'} bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center`}
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Brain className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Learning Style Assessment
          </h1>
          <p className="text-gray-600 mb-4">
            Help us personalize your learning experience by answering these 5 questions
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-emerald-500 h-2 rounded-full"
            />
          </div>
          <p className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {quizQuestions.length}
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
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 text-center">
              {currentQ.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options.map((option, index) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswer(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                    answers[currentQ.id] === option.value
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      answers[currentQ.id] === option.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
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
                Skip Quiz
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={!answers[currentQ.id] || isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentQuestion === quizQuestions.length - 1 ? (
                'Complete'
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

