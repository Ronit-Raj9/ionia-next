import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuestionTime {
  questionId: number;
  startTime: number;
  totalTime: number;
  visits: number;
}

interface TimeTrackingState {
  questionTimes: { [key: number]: QuestionTime };
  currentQuestionId: number | null;
  currentQuestionStartTime: number | null;
}

const initialState: TimeTrackingState = {
  questionTimes: {},
  currentQuestionId: null,
  currentQuestionStartTime: null,
};

const timeTrackingSlice = createSlice({
  name: 'timeTracking',
  initialState,
  reducers: {
    startQuestionTimer: (state, action: PayloadAction<number>) => {
      const questionId = action.payload;
      const now = Date.now();

      // If there was a previous question, update its time
      if (state.currentQuestionId !== null && state.currentQuestionStartTime !== null) {
        const timeSpent = now - state.currentQuestionStartTime;
        const prevQuestion = state.questionTimes[state.currentQuestionId] || {
          questionId: state.currentQuestionId,
          startTime: state.currentQuestionStartTime,
          totalTime: 0,
          visits: 0,
        };

        state.questionTimes[state.currentQuestionId] = {
          ...prevQuestion,
          totalTime: prevQuestion.totalTime + timeSpent,
        };
      }

      // Start timing the new question
      if (!state.questionTimes[questionId]) {
        state.questionTimes[questionId] = {
          questionId,
          startTime: now,
          totalTime: 0,
          visits: 1,
        };
      } else {
        state.questionTimes[questionId].visits += 1;
      }

      state.currentQuestionId = questionId;
      state.currentQuestionStartTime = now;
    },

    pauseQuestionTimer: (state) => {
      if (state.currentQuestionId !== null && state.currentQuestionStartTime !== null) {
        const now = Date.now();
        const timeSpent = now - state.currentQuestionStartTime;
        const currentQuestion = state.questionTimes[state.currentQuestionId];

        if (currentQuestion) {
          state.questionTimes[state.currentQuestionId] = {
            ...currentQuestion,
            totalTime: currentQuestion.totalTime + timeSpent,
          };
        }
      }
      state.currentQuestionId = null;
      state.currentQuestionStartTime = null;
    },

    resetTimeTracking: (state) => {
      state.questionTimes = {};
      state.currentQuestionId = null;
      state.currentQuestionStartTime = null;
    },

    updateQuestionTime: (state, action: PayloadAction<{ questionId: number; timeSpent: number }>) => {
      const { questionId, timeSpent } = action.payload;
      if (state.questionTimes[questionId]) {
        state.questionTimes[questionId].totalTime += timeSpent;
      }
    },
  },
});

export const {
  startQuestionTimer,
  pauseQuestionTimer,
  resetTimeTracking,
  updateQuestionTime,
} = timeTrackingSlice.actions;

export default timeTrackingSlice.reducer; 