// ==========================================
// 📝 ENHANCED AUTH LOGGER & ERROR TRACKING
// ==========================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: number;
  context?: string;
}

class AuthLogger {
  private isDevelopment: boolean;
  private isDebugEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true' || this.isDevelopment;
  }

  private shouldLog(level: LogLevel): boolean {
    if (level === 'debug') return this.isDebugEnabled;
    if (level === 'info') return this.isDevelopment;
    return true; // Always log warnings and errors
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data, context);
    
    // Use centralized logging - remove direct console calls
    // All logging should go through authLogger methods
    switch (level) {
      case 'debug':
        // Debug logging only in development
        if (this.isDevelopment) {
          console.debug(`🔍 ${formattedMessage}`);
        }
        break;
      case 'info':
        // Info logging only in development
        if (this.isDevelopment) {
          console.info(`ℹ️ ${formattedMessage}`);
        }
        break;
      case 'warn':
        // Warn logging in development and production
        console.warn(`⚠️ ${formattedMessage}`);
        break;
      case 'error':
        // Error logging in development and production
        console.error(`❌ ${formattedMessage}`);
        break;
    }
  }

  debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: any, context?: string): void {
    this.log('error', message, data, context);
  }

  authFlow(action: string, data?: any): void {
    this.info(`Auth flow: ${action}`, data, 'AUTH');
  }

  tokenRefresh(success: boolean, data?: any): void {
    if (success) {
      this.info('Token refresh successful', data, 'TOKEN');
    } else {
      this.error('Token refresh failed', data, 'TOKEN');
    }
  }

  crossTabSync(event: string, data?: any): void {
    this.debug(`Cross-tab sync: ${event}`, data, 'SYNC');
  }

  securityEvent(event: string, data?: any): void {
    this.warn(`Security event: ${event}`, data, 'SECURITY');
  }

  performanceMetric(metric: string, value: number, unit: string = 'ms'): void {
    this.debug(`Performance: ${metric} = ${value}${unit}`, {}, 'PERF');
  }
}

// Create logger instance
const authLogger = new AuthLogger();

// ==========================================
// 🚨 ENHANCED ERROR TRACKING (NO SENTRY)
// ==========================================

interface ErrorTrackingConfig {
  environment: 'development' | 'production' | 'test';
  userId?: string;
  sessionId?: string;
}

class ErrorTracker {
  private config: ErrorTrackingConfig;

  constructor(config: ErrorTrackingConfig) {
    this.config = config;
  }

  setUser(userId: string, userData?: Record<string, any>) {
    authLogger.info('User context set', { userId, userData }, 'TRACKING');
    
    // Remove direct console logging - use authLogger instead
    // Development logging is handled by authLogger.debug()
  }

  trackError(error: Error, context?: Record<string, any>) {
    // Enhanced error logging through authLogger
    authLogger.error('Error tracked', { 
      error: error.message, 
      stack: error.stack,
      context 
    }, 'TRACKING');
    
    // Remove direct console logging - use authLogger instead
    // Development logging is handled by authLogger.debug()
  }

  trackAuthEvent(event: string, data?: Record<string, any>) {
    authLogger.info(`Auth event: ${event}`, data, 'TRACKING');
    
    // Remove direct console logging - use authLogger instead
    // Development logging is handled by authLogger.debug()
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    authLogger.performanceMetric(metric, value, unit);
    
    // Remove direct console logging - use authLogger instead
    // Development logging is handled by authLogger.debug()
  }
}

// Initialize error tracker
const errorTracker = new ErrorTracker({
  environment: process.env.NODE_ENV as 'development' | 'production' | 'test',
});

export { authLogger, errorTracker };

// Export types for external use
export type { LogLevel, LogEntry };