"use client";
import { useState, useEffect } from 'react';

export const useTestProgress = (totalQuestions: number) => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [timer, setTimer] = useState<number>(0); // Time in seconds
  const [isTestStarted, setIsTestStarted] = useState<boolean>(false);

  const startTest = () => {
    setIsTestStarted(true);
  };

  const stopTest = () => {
    setIsTestStarted(false);
  };

  const nextQuestion = () => {
    setCurrentQuestion(prev => (prev < totalQuestions ? prev + 1 : prev));
  };

  const previousQuestion = () => {
    setCurrentQuestion(prev => (prev > 1 ? prev - 1 : prev));
  };

  const markQuestionAsAnswered = (questionNumber: number) => {
    setAnsweredQuestions(prev => new Set([...prev, questionNumber]));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTestStarted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTestStarted]);

  return {
    currentQuestion,
    answeredQuestions,
    timer,
    startTest,
    stopTest,
    nextQuestion,
    previousQuestion,
    markQuestionAsAnswered,
  };
};
