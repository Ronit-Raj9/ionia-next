// ==========================================
// 📝 ENVIRONMENT-BASED LOGGER
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
    this.isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (this.isDebugEnabled) return true;
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data, context);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
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

  // Auth-specific logging methods
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
    this.debug(`Performance: ${metric} = ${value}${unit}`, undefined, 'PERF');
  }
}

// Export singleton instance
export const authLogger = new AuthLogger();

// Export types for external use
export type { LogLevel, LogEntry };
