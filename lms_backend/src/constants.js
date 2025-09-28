// LMS Backend Constants
export const DB_NAME = "ionia"; // Shared database with main backend

// LMS-specific constants
export const LMS_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  INSTRUCTOR: 'instructor'
};

export const QUESTION_CATEGORIES = {
  THEORETICAL: 'theoretical',
  NUMERICAL: 'numerical',
  DIAGRAMMATIC: 'diagrammatic',
  CRITICAL_THINKING: 'critical_thinking'
};

export const QUESTION_CHAIN_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft'
};

export const STUDENT_PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

export const LMS_ENDPOINTS = {
  AUTH: '/api/v1/auth',
  USERS: '/api/v1/users',
  QUESTIONS: '/api/v1/questions',
  CHAINS: '/api/v1/chains',
  PROGRESS: '/api/v1/progress',
  ANALYTICS: '/api/v1/analytics'
};

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100
};

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export const RATE_LIMITS = {
  LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  REGISTER: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
  API: { windowMs: 15 * 60 * 1000, max: 100 } // 100 requests per 15 minutes
};
