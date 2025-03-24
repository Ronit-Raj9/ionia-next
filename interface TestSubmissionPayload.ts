interface TestSubmissionPayload {
    // Core Test Information
    testId: string;
    userId: string;
    attemptNumber: number;
    language: string;
    startTime: number;
    endTime: number;
  
    // Question States
    questionStates: {
      notVisited: string[];
      notAnswered: string[];
      answered: string[];
      markedForReview: string[];
      markedAndAnswered: string[];
    };
  
    // Basic Response Data
    responses: {
      [questionId: string]: {
        selectedOption: number | null;
        isMarked: boolean;
        timeSpent: number;
        visits: number;
        firstVisitTime: number;
        lastVisitTime: number;
      };
    };
  
    // Question-Level Analytics
    questionAnalytics: {
      [questionId: string]: {
        changeHistory: Array<{
          timestamp: number;
          fromOption: number | null;
          toOption: number | null;
        }>;
        hesitationTime: number;
        revisionCount: number;
        timeBeforeMarking: number;
      };
    };
  
    // Subject-Level Analytics
    subjectAnalytics: {
      [subject: string]: {
        accuracy: number;
        averageTimePerQuestion: number;
        questionsAttempted: number;
        scoreObtained: number;
        weakTopics: string[];
        strongTopics: string[];
        improvementAreas: Array<{
          topic: string;
          accuracy: number;
          averageTime: number;
        }>;
      };
    };
  
    // Time Analysis
    timeAnalytics: {
      totalTimeSpent: number;
      averageTimePerQuestion: number;
      questionTimeDistribution: {
        lessThan30Sec: string[];
        between30To60Sec: string[];
        between1To2Min: string[];
        moreThan2Min: string[];
      };
      peakPerformancePeriods: Array<{
        startTime: number;
        endTime: number;
        questionsAnswered: number;
        correctAnswers: number;
      }>;
      fatiguePeriods: Array<{
        startTime: number;
        endTime: number;
        increasedTimePerQuestion: number;
        wrongAnswers: number;
      }>;
    };
  
    // Error Analysis
    errorAnalytics: {
      commonMistakes: Array<{
        questionId: string;
        selectedOption: number;
        correctOption: number;
        conceptTested: string;
        timeSpentBeforeError: number;
      }>;
      errorPatterns: {
        conceptualErrors: string[];
        calculationErrors: string[];
        timeManagementErrors: string[];
        carelessMistakes: string[];
      };
    };
  
    // Behavioral Patterns
    behavioralAnalytics: {
      revisitPatterns: Array<{
        questionId: string;
        visitCount: number;
        timeBetweenVisits: number[];
        finalOutcome: "correct" | "incorrect" | "unattempted";
      }>;
      sectionTransitions: Array<{
        fromSubject: string;
        toSubject: string;
        timestamp: number;
        timeSpentInPrevSection: number;
      }>;
      confidenceMetrics: {
        quickAnswers: string[];
        longDeliberations: string[];
        multipleRevisions: string[];
      };
    };
  
    // Performance Progress
    progressionMetrics: {
      accuracyTrend: Array<{
        questionNumber: number;
        isCorrect: boolean;
        timeSpent: number;
        cumulativeAccuracy: number;
      }>;
      speedTrend: Array<{
        segment: number;
        averageTimePerQuestion: number;
        questionsAttempted: number;
      }>;
      subjectProgression: {
        [subject: string]: {
          firstHalfAccuracy: number;
          secondHalfAccuracy: number;
          timePerQuestionTrend: number[];
        };
      };
    };
  
    // Historical Comparison
    historicalComparison: {
      previousAttempts: Array<{
        attemptId: string;
        date: number;
        score: number;
        timeSpent: number;
        improvement: number;
      }>;
      strengthProgress: {
        [subject: string]: {
          previousScore: number;
          currentScore: number;
          improvement: number;
        };
      };
    };
  
    // User Interaction Details
    interactionMetrics: {
      mouseMovements: Array<{
        timestamp: number;
        questionId: string;
        action: "hover" | "click" | "scroll";
        duration: number;
      }>;
      keyboardUsage: Array<{
        timestamp: number;
        questionId: string;
        keyCount: number;
        duration: number;
      }>;
      scrollPatterns: Array<{
        timestamp: number;
        direction: "up" | "down";
        distance: number;
      }>;
    };
  
    // Question Difficulty Analysis
    difficultyMetrics: {
      perceivedDifficulty: {
        [questionId: string]: {
          timeSpentRatio: number;
          changesRatio: number;
          hesitationRatio: number;
        };
      };
      difficultyDistribution: {
        easy: string[];
        medium: string[];
        hard: string[];
        veryHard: string[];
      };
    };
  
    // Strategic Analysis
    strategyMetrics: {
      questionSequencing: {
        optimalChoices: number;
        backtracking: number;
        subjectSwitching: number;
      };
      timeOptimization: {
        timeWastedOnIncorrect: number;
        timeSpentOnCorrect: number;
        unusedTime: number;
      };
      markingStrategy: {
        correctlyMarkedReview: number;
        unnecessaryReviews: number;
        effectiveRevisions: number;
      };
    };
  
    // Test Completion Metrics
    completionMetrics: {
      paceAnalysis: {
        plannedPace: number;
        actualPace: number;
        paceVariation: number[];
      };
      sectionCompletion: {
        [subject: string]: {
          completionRate: number;
          timeUtilization: number;
          efficiency: number;
        };
      };
      timeManagementScore: number;
    };
  
    // Navigation History
    navigationHistory: Array<{
      timestamp: number;
      fromQuestion: string | null;
      toQuestion: string | null;
      action: "click" | "next" | "prev" | "mark" | "unmark" | "answer";
    }>;
  
    // Environment Data
    environment: {
      device: {
        userAgent: string;
        screenResolution: string;
        deviceType: "mobile" | "tablet" | "desktop";
      };
      session: {
        tabSwitches: number;
        disconnections: Array<{
          startTime: number;
          endTime: number;
        }>;
        browserRefreshes: number;
      };
    };
  }
  
  send this complete detailed analysis to the backend @attemptedTest.controller.js @attemptedTest.model.js @attemptedTest.routes.js . And make proper workflow so that when user clicks on submit then send the data to backend and then response comes with is beign displayed in the analysis page
  
  I want all the payload data should be integrated in the frontend and backend workflow. So please do it. donot leave any data. Just integrate the whole data