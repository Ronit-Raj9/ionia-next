"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Target,
  Heart,
  Users,
  Zap,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { oceanQuizQuestions, calculateOceanScores, deriveLearningPreferences, deriveIntellectualTraits, getLearningStyleDescription } from '@/lib/oceanQuizQuestions';

interface OceanPersonalityQuizProps {
  studentId: string;
  onComplete: (result: any) => void;
  onSkip?: () => void;
  isEmbedded?: boolean;
}

const likertScale = [
  { value: 1, label: 'Strongly Disagree', emoji: '😔', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 2, label: 'Disagree', emoji: '😐', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 3, label: 'Neutral', emoji: '😶', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 4, label: 'Agree', emoji: '😊', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 5, label: 'Strongly Agree', emoji: '😄', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' }
];

const traitIcons: Record<string, React.ReactNode> = {
  openness: <Sparkles className="w-5 h-5" />,
  conscientiousness: <Target className="w-5 h-5" />,
  extraversion: <Users className="w-5 h-5" />,
  agreeableness: <Heart className="w-5 h-5" />,
  neuroticism: <Shield className="w-5 h-5" />
};

const traitDescriptions: Record<string, string> = {
  openness: 'Creativity & Curiosity',
  conscientiousness: 'Organization & Discipline',
  extraversion: 'Sociability & Enthusiasm',
  agreeableness: 'Cooperation & Compassion',
  neuroticism: 'Emotional Stability'
};

export default function OceanPersonalityQuiz({ 
  studentId, 
  onComplete, 
  onSkip, 
  isEmbedded = false 
}: OceanPersonalityQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const currentQ = oceanQuizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / oceanQuizQuestions.length) * 100;
  const isLastQuestion = currentQuestion === oceanQuizQuestions.length - 1;

  const handleResponse = (value: number) => {
    setResponses(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
  };

  const handleNext = () => {
    if (!responses[currentQ.id]) {
      toast.error('Please select an option before continuing');
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
      // Calculate OCEAN scores
      const oceanScores = calculateOceanScores(responses);
      
      // Derive learning preferences
      const learningPrefs = deriveLearningPreferences(oceanScores);
      
      // Derive intellectual traits
      const intellectualTraits = deriveIntellectualTraits(oceanScores);
      
      // Get learning style description
      const learningStyleDesc = getLearningStyleDescription(learningPrefs);
      
      const fullProfile = {
        oceanTraits: oceanScores,
        learningPreferences: learningPrefs,
        intellectualTraits,
        learningStyleDescription: learningStyleDesc,
        personalityTestCompleted: true,
        testTakenDate: new Date()
      };
      
      setProfile(fullProfile);
      
      // Save to database
      const response = await fetch('/api/student-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          oceanTraits: oceanScores,
          learningPreferences: learningPrefs,
          intellectualTraits,
          personalityTestCompleted: true,
          testTakenDate: new Date(),
          quizResponses: responses
        }),
      });

      if (response.ok) {
        setShowResult(true);
        toast.success('Your learning profile has been created! 🎉');
        
        // Call onComplete after showing results
        setTimeout(() => {
          onComplete(fullProfile);
        }, 3000);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult && profile) {
    const { oceanTraits, learningPreferences, intellectualTraits, learningStyleDescription } = profile;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${isEmbedded ? 'p-4' : 'min-h-screen'} bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center`}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Learning Profile Complete! 🎉
            </h2>
            <p className="text-gray-600">
              Your assignments will now be personalized based on your unique learning style
            </p>
          </motion.div>

          {/* OCEAN Traits Visualization */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Personality Traits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(oceanTraits).map(([trait, score], index) => (
                <motion.div
                  key={trait}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {traitIcons[trait]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">{trait}</h4>
                        <p className="text-xs text-gray-600">{traitDescriptions[trait]}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className={`h-2 rounded-full ${
                        score >= 75 ? 'bg-green-500' :
                        score >= 50 ? 'bg-blue-500' :
                        score >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Learning Style */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Learning Style</h3>
                <p className="text-sm text-gray-600">
                  {learningPreferences.visualLearner ? 'Visual Learner' :
                   learningPreferences.auditoryLearner ? 'Auditory Learner' :
                   learningPreferences.kinestheticLearner ? 'Kinesthetic Learner' :
                   'Reading/Writing Learner'}
                </p>
              </div>
            </div>
            <p className="text-gray-700">{learningStyleDescription}</p>
          </div>

          {/* Intellectual Traits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(intellectualTraits).map(([trait, score]) => (
              <div key={trait} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 mb-1">{score}%</div>
                <div className="text-xs text-gray-600 capitalize">
                  {trait.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>

          {/* Learning Preferences */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">How This Helps You:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {learningPreferences.needsStepByStepGuidance && (
                <li className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>You'll receive <strong>step-by-step guidance</strong> in your assignments</span>
                </li>
              )}
              {learningPreferences.visualLearner && (
                <li className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Assignments will include <strong>visual aids and diagrams</strong></span>
                </li>
              )}
              {learningPreferences.respondsToEncouragement && (
                <li className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>You'll get <strong>encouraging feedback</strong> to boost your confidence</span>
                </li>
              )}
              <li className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Difficulty level adjusted to <strong>{learningPreferences.preferredDifficulty}</strong></span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
                className="bg-emerald-500 h-2 rounded-full"
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to dashboard in 3 seconds...
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
            OCEAN Personality Assessment
          </h1>
          <p className="text-gray-600 mb-4">
            Answer these 15 questions honestly to help us personalize your learning experience
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full"
            />
          </div>
          <p className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {oceanQuizQuestions.length}
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
            {/* Trait Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {traitIcons[currentQ.trait]}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {traitDescriptions[currentQ.trait]}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 text-center">
              "{currentQ.question}"
            </h2>

            {/* Likert Scale */}
            <div className="space-y-3">
              {likertScale.map((option, index) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleResponse(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-102 ${
                    responses[currentQ.id] === option.value
                      ? `${option.color} border-current shadow-lg scale-102`
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className={`font-medium ${
                        responses[currentQ.id] === option.value
                          ? 'text-current'
                          : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    {responses[currentQ.id] === option.value && (
                      <CheckCircle className="w-6 h-6 text-current" />
                    )}
                  </div>
                </motion.button>
              ))}
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
              disabled={!responses[currentQ.id] || isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
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

