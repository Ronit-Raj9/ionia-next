import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Time tracking interfaces
export interface QuestionTimeEntry {
  questionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  isActive: boolean;
  visitCount: number;
}

export interface SessionTimeData {
  sessionId: string;
  testId: string;
  userId: string;
  sessionStartTime: number;
  sessionEndTime?: number;
  totalDuration: number;
  pausedDuration: number;
  isActive: boolean;
  questionTimes: { [questionId: string]: QuestionTimeEntry };
}

export interface TimeStatistics {
  totalTestTime: number;
  totalActiveTime: number;
  totalPausedTime: number;
  averageTimePerQuestion: number;
  fastestQuestion: { questionId: string; time: number } | null;
  slowestQuestion: { questionId: string; time: number } | null;
  timeDistribution: {
    veryFast: number; // < 30 seconds
    fast: number; // 30-60 seconds
    moderate: number; // 60-120 seconds
    slow: number; // 120-180 seconds
    verySlow: number; // > 180 seconds
  };
}

interface TimeTrackingState {
  // Current session data
  currentSession: SessionTimeData | null;
  currentQuestionId: string | null;
  isTracking: boolean;
  isPaused: boolean;
  
  // Time tracking
  sessionStartTime: number | null;
  questionStartTime: number | null;
  pauseStartTime: number | null;
  
  // Statistics
  statistics: TimeStatistics | null;
  
  // History
  sessionHistory: { [sessionId: string]: SessionTimeData };
  
  // Actions
  startSession: (testId: string, userId: string) => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  startQuestionTracking: (questionId: string) => void;
  endQuestionTracking: () => void;
  switchQuestion: (fromQuestionId: string, toQuestionId: string) => void;
  updateQuestionVisit: (questionId: string) => void;
  calculateStatistics: () => void;
  resetSession: () => void;
  saveSessionToHistory: () => void;
  
  // Getters
  getCurrentQuestionTime: () => number;
  getTotalSessionTime: () => number;
  getQuestionTime: (questionId: string) => number;
  getQuestionVisitCount: (questionId: string) => number;
  isQuestionVisited: (questionId: string) => boolean;
}

export const useTimeTrackingStore = create<TimeTrackingState>()(
  immer((set, get) => ({
    // Initial state
    currentSession: null,
    currentQuestionId: null,
    isTracking: false,
    isPaused: false,
    sessionStartTime: null,
    questionStartTime: null,
    pauseStartTime: null,
    statistics: null,
    sessionHistory: {},

    // Session management
    startSession: (testId, userId) =>
      set((state) => {
        const now = Date.now();
        const sessionId = `${testId}_${userId}_${now}`;
        
        state.currentSession = {
          sessionId,
          testId,
          userId,
          sessionStartTime: now,
          sessionEndTime: undefined,
          totalDuration: 0,
          pausedDuration: 0,
          isActive: true,
          questionTimes: {},
        };
        
        state.sessionStartTime = now;
        state.isTracking = true;
        state.isPaused = false;
        state.pauseStartTime = null;
        state.currentQuestionId = null;
        state.questionStartTime = null;
      }),

    endSession: () =>
      set((state) => {
        if (!state.currentSession) return;
        
        const now = Date.now();
        
        // End current question tracking if active
        if (state.currentQuestionId && state.questionStartTime) {
          const questionDuration = now - state.questionStartTime;
          const questionEntry = state.currentSession.questionTimes[state.currentQuestionId];
          
          if (questionEntry) {
            questionEntry.endTime = now;
            questionEntry.duration += questionDuration;
            questionEntry.isActive = false;
          }
        }
        
        // Calculate total session duration
        let totalDuration = 0;
        if (state.sessionStartTime) {
          totalDuration = now - state.sessionStartTime;
          
          // Subtract paused time if currently paused
          if (state.isPaused && state.pauseStartTime) {
            const currentPauseDuration = now - state.pauseStartTime;
            totalDuration -= (state.currentSession.pausedDuration + currentPauseDuration);
          } else {
            totalDuration -= state.currentSession.pausedDuration;
          }
        }
        
        state.currentSession.sessionEndTime = now;
        state.currentSession.totalDuration = totalDuration;
        state.currentSession.isActive = false;
        
        state.isTracking = false;
        state.isPaused = false;
        state.currentQuestionId = null;
        state.questionStartTime = null;
        state.pauseStartTime = null;
        
        // Calculate statistics
        get().calculateStatistics();
        
        // Save to history
        get().saveSessionToHistory();
      }),

    pauseSession: () =>
      set((state) => {
        if (!state.isTracking || state.isPaused) return;
        
        const now = Date.now();
        state.isPaused = true;
        state.pauseStartTime = now;
        
        // Pause current question tracking
        if (state.currentQuestionId && state.questionStartTime && state.currentSession) {
          const questionDuration = now - state.questionStartTime;
          const questionEntry = state.currentSession.questionTimes[state.currentQuestionId];
          
          if (questionEntry) {
            questionEntry.duration += questionDuration;
          }
          
          state.questionStartTime = null;
        }
      }),

    resumeSession: () =>
      set((state) => {
        if (!state.isTracking || !state.isPaused) return;
        
        const now = Date.now();
        
        // Calculate paused duration
        if (state.pauseStartTime && state.currentSession) {
          const pauseDuration = now - state.pauseStartTime;
          state.currentSession.pausedDuration += pauseDuration;
        }
        
        state.isPaused = false;
        state.pauseStartTime = null;
        
        // Resume question tracking if there's a current question
        if (state.currentQuestionId) {
          state.questionStartTime = now;
        }
      }),

    // Question tracking
    startQuestionTracking: (questionId) =>
      set((state) => {
        if (!state.currentSession || !state.isTracking || state.isPaused) return;
        
        const now = Date.now();
        
        // End previous question tracking
        if (state.currentQuestionId && state.questionStartTime) {
          const prevQuestionDuration = now - state.questionStartTime;
          const prevQuestionEntry = state.currentSession.questionTimes[state.currentQuestionId];
          
          if (prevQuestionEntry) {
            prevQuestionEntry.endTime = now;
            prevQuestionEntry.duration += prevQuestionDuration;
            prevQuestionEntry.isActive = false;
          }
        }
        
        // Initialize or update question entry
        if (!state.currentSession.questionTimes[questionId]) {
          state.currentSession.questionTimes[questionId] = {
            questionId,
            startTime: now,
            duration: 0,
            isActive: true,
            visitCount: 1,
          };
        } else {
          const questionEntry = state.currentSession.questionTimes[questionId];
          questionEntry.startTime = now;
          questionEntry.isActive = true;
          questionEntry.visitCount += 1;
        }
        
        state.currentQuestionId = questionId;
        state.questionStartTime = now;
      }),

    endQuestionTracking: () =>
      set((state) => {
        if (!state.currentQuestionId || !state.questionStartTime || !state.currentSession) return;
        
        const now = Date.now();
        const questionDuration = now - state.questionStartTime;
        const questionEntry = state.currentSession.questionTimes[state.currentQuestionId];
        
        if (questionEntry) {
          questionEntry.endTime = now;
          questionEntry.duration += questionDuration;
          questionEntry.isActive = false;
        }
        
        state.currentQuestionId = null;
        state.questionStartTime = null;
      }),

    switchQuestion: (fromQuestionId, toQuestionId) =>
      set((state) => {
        if (!state.currentSession || !state.isTracking || state.isPaused) return;
        
        const now = Date.now();
        
        // End tracking for the previous question
        if (state.questionStartTime) {
          const questionDuration = now - state.questionStartTime;
          const fromQuestionEntry = state.currentSession.questionTimes[fromQuestionId];
          
          if (fromQuestionEntry) {
            fromQuestionEntry.endTime = now;
            fromQuestionEntry.duration += questionDuration;
            fromQuestionEntry.isActive = false;
          }
        }
        
        // Start tracking for the new question
        if (!state.currentSession.questionTimes[toQuestionId]) {
          state.currentSession.questionTimes[toQuestionId] = {
            questionId: toQuestionId,
            startTime: now,
            duration: 0,
            isActive: true,
            visitCount: 1,
          };
        } else {
          const toQuestionEntry = state.currentSession.questionTimes[toQuestionId];
          toQuestionEntry.startTime = now;
          toQuestionEntry.isActive = true;
          toQuestionEntry.visitCount += 1;
        }
        
        state.currentQuestionId = toQuestionId;
        state.questionStartTime = now;
      }),

    updateQuestionVisit: (questionId) =>
      set((state) => {
        if (!state.currentSession) return;
        
        if (state.currentSession.questionTimes[questionId]) {
          state.currentSession.questionTimes[questionId].visitCount += 1;
        } else {
          const now = Date.now();
          state.currentSession.questionTimes[questionId] = {
            questionId,
            startTime: now,
            duration: 0,
            isActive: false,
            visitCount: 1,
          };
        }
      }),

    // Statistics calculation
    calculateStatistics: () =>
      set((state) => {
        if (!state.currentSession) return;
        
        const questionTimes = Object.values(state.currentSession.questionTimes);
        const totalQuestions = questionTimes.length;
        
        if (totalQuestions === 0) {
          state.statistics = null;
          return;
        }
        
        const totalActiveTime = questionTimes.reduce((sum, qt) => sum + qt.duration, 0);
        const averageTime = totalActiveTime / totalQuestions;
        
        // Find fastest and slowest questions
        const sortedTimes = questionTimes.filter(qt => qt.duration > 0).sort((a, b) => a.duration - b.duration);
        const fastest = sortedTimes.length > 0 ? { questionId: sortedTimes[0].questionId, time: sortedTimes[0].duration } : null;
        const slowest = sortedTimes.length > 0 ? { questionId: sortedTimes[sortedTimes.length - 1].questionId, time: sortedTimes[sortedTimes.length - 1].duration } : null;
        
        // Calculate time distribution
        const distribution = {
          veryFast: 0,
          fast: 0,
          moderate: 0,
          slow: 0,
          verySlow: 0,
        };
        
        questionTimes.forEach((qt) => {
          const timeInSeconds = qt.duration / 1000;
          if (timeInSeconds < 30) distribution.veryFast++;
          else if (timeInSeconds < 60) distribution.fast++;
          else if (timeInSeconds < 120) distribution.moderate++;
          else if (timeInSeconds < 180) distribution.slow++;
          else distribution.verySlow++;
        });
        
        state.statistics = {
          totalTestTime: state.currentSession.totalDuration,
          totalActiveTime,
          totalPausedTime: state.currentSession.pausedDuration,
          averageTimePerQuestion: averageTime,
          fastestQuestion: fastest,
          slowestQuestion: slowest,
          timeDistribution: distribution,
        };
      }),

    // Utility actions
    resetSession: () =>
      set((state) => {
        state.currentSession = null;
        state.currentQuestionId = null;
        state.isTracking = false;
        state.isPaused = false;
        state.sessionStartTime = null;
        state.questionStartTime = null;
        state.pauseStartTime = null;
        state.statistics = null;
      }),

    saveSessionToHistory: () => {
      const state = get();
      if (state.currentSession) {
        set((draft) => {
          draft.sessionHistory[state.currentSession!.sessionId] = { ...state.currentSession! };
        });
      }
    },

    // Getters
    getCurrentQuestionTime: () => {
      const state = get();
      if (!state.currentQuestionId || !state.questionStartTime || state.isPaused) {
        return 0;
      }
      return Date.now() - state.questionStartTime;
    },

    getTotalSessionTime: () => {
      const state = get();
      if (!state.sessionStartTime) return 0;
      
      let totalTime = Date.now() - state.sessionStartTime;
      
      if (state.currentSession) {
        totalTime -= state.currentSession.pausedDuration;
        
        // Subtract current pause duration if paused
        if (state.isPaused && state.pauseStartTime) {
          totalTime -= (Date.now() - state.pauseStartTime);
        }
      }
      
      return Math.max(0, totalTime);
    },

    getQuestionTime: (questionId) => {
      const state = get();
      if (!state.currentSession) return 0;
      
      const questionEntry = state.currentSession.questionTimes[questionId];
      if (!questionEntry) return 0;
      
      let totalTime = questionEntry.duration;
      
      // Add current active time if this is the current question
      if (questionId === state.currentQuestionId && state.questionStartTime && !state.isPaused) {
        totalTime += Date.now() - state.questionStartTime;
      }
      
      return totalTime;
    },

    getQuestionVisitCount: (questionId) => {
      const state = get();
      if (!state.currentSession) return 0;
      
      const questionEntry = state.currentSession.questionTimes[questionId];
      return questionEntry ? questionEntry.visitCount : 0;
    },

    isQuestionVisited: (questionId) => {
      const state = get();
      return !!state.currentSession?.questionTimes[questionId];
    },
  }))
);

// Convenience hooks
export const useTimeTracking = () => {
  return useTimeTrackingStore((state) => ({
    isTracking: state.isTracking,
    isPaused: state.isPaused,
    currentQuestionId: state.currentQuestionId,
    startSession: state.startSession,
    endSession: state.endSession,
    pauseSession: state.pauseSession,
    resumeSession: state.resumeSession,
    resetSession: state.resetSession,
  }));
};

export const useQuestionTimeTracking = () => {
  return useTimeTrackingStore((state) => ({
    startQuestionTracking: state.startQuestionTracking,
    endQuestionTracking: state.endQuestionTracking,
    switchQuestion: state.switchQuestion,
    updateQuestionVisit: state.updateQuestionVisit,
    getCurrentQuestionTime: state.getCurrentQuestionTime,
    getQuestionTime: state.getQuestionTime,
    getQuestionVisitCount: state.getQuestionVisitCount,
    isQuestionVisited: state.isQuestionVisited,
  }));
};

export const useTimeStatistics = () => {
  return useTimeTrackingStore((state) => ({
    statistics: state.statistics,
    currentSession: state.currentSession,
    sessionHistory: state.sessionHistory,
    calculateStatistics: state.calculateStatistics,
    getTotalSessionTime: state.getTotalSessionTime,
  }));
}; 