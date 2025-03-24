export interface AccuracyTrendPoint {
  cumulativeAccuracy: number;
  timeSpent: number;
  isCorrect: boolean;
}

export interface SpeedTrendSegment {
  segment: number;
  averageTimePerQuestion: number;
  questionsAttempted: number;
}

export interface SubjectProgressionData {
  firstHalfAccuracy: number;
  secondHalfAccuracy: number;
}

export interface SubjectMetrics {
  correct: number;
  attempted: number;
  total: number;
  timeSpent: number;
}

export interface HistoricalAttempt {
  attemptId: number;
  score: number;
  timeSpent: number;
}

export interface ProgressionMetrics {
  accuracyTrend: AccuracyTrendPoint[];
  speedTrend: SpeedTrendSegment[];
  subjectProgression: Record<string, SubjectProgressionData>;
}

export interface HistoricalComparison {
  previousAttempts: HistoricalAttempt[];
}

export interface AnalysisData {
  progressionMetrics: ProgressionMetrics;
  historicalComparison: HistoricalComparison;
  subjectWise: Record<string, SubjectMetrics>;
}

export interface QuestionAnalysisType {
  id: string;
  question: string;
  correctAnswer: string;
  userAnswer: string | null;
  timeSpent: number;
  isCorrect: boolean;
  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
} 