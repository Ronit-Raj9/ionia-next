import mongoose from 'mongoose';
import { Logger } from './error.middleware.js';
import { ApiError } from '../utils/ApiError.js';

// Metrics storage
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatus: {},
        byMethod: {},
        byEndpoint: {}
      },
      performance: {
        responseTimeHistogram: [],
        averageResponseTime: 0,
        slowRequests: [] // Track requests > 1s
      },
      errors: {
        total: 0,
        byCategory: {},
        recent: []
      },
      system: {
        uptime: 0,
        memoryUsage: {},
        cpuUsage: 0
      },
      database: {
        connectionStatus: 'unknown',
        queryCount: 0,
        slowQueries: [],
        connectionPool: {}
      },
      externalServices: {
        cloudinary: { status: 'unknown', lastCheck: null },
        email: { status: 'unknown', lastCheck: null }
      }
    };
    
    this.startTime = Date.now();
    
    // Start periodic system metrics collection
    this.startSystemMetricsCollection();
  }

  // Record request metrics
  recordRequest(req, res, duration) {
    this.metrics.requests.total++;
    
    // Status code tracking
    const statusCode = res.statusCode;
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1;
    
    // Success/failure tracking
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Method tracking
    const method = req.method;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    
    // Endpoint tracking
    const endpoint = req.route?.path || req.originalUrl;
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // Performance tracking
    this.recordPerformance(req, duration);
  }

  recordPerformance(req, duration) {
    // Add to histogram (keep last 1000 requests)
    this.metrics.performance.responseTimeHistogram.push(duration);
    if (this.metrics.performance.responseTimeHistogram.length > 1000) {
      this.metrics.performance.responseTimeHistogram.shift();
    }
    
    // Calculate average response time
    const times = this.metrics.performance.responseTimeHistogram;
    this.metrics.performance.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
    
    // Track slow requests (> 1 second)
    if (duration > 1000) {
      this.metrics.performance.slowRequests.push({
        url: req.originalUrl,
        method: req.method,
        duration,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent')
      });
      
      // Keep only last 50 slow requests
      if (this.metrics.performance.slowRequests.length > 50) {
        this.metrics.performance.slowRequests.shift();
      }
    }
  }

  recordError(category) {
    this.metrics.errors.total++;
    this.metrics.errors.byCategory[category] = (this.metrics.errors.byCategory[category] || 0) + 1;
    
    // Keep recent errors (last 100)
    this.metrics.errors.recent.push({
      category,
      timestamp: new Date().toISOString()
    });
    
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent.shift();
    }
  }

  startSystemMetricsCollection() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  collectSystemMetrics() {
    // Uptime
    this.metrics.system.uptime = Date.now() - this.startTime;
    
    // Memory usage
    this.metrics.system.memoryUsage = process.memoryUsage();
    
    // Database metrics
    this.collectDatabaseMetrics();
  }

  collectDatabaseMetrics() {
    try {
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      this.metrics.database.connectionStatus = states[dbState] || 'unknown';
      
      // Connection pool info (if available)
      if (mongoose.connection.db) {
        this.metrics.database.connectionPool = {
          serverStatus: mongoose.connection.db.serverConfig?.s?.state || 'unknown'
        };
      }
    } catch (error) {
      Logger.error('Failed to collect database metrics', { error: error.message });
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    };
  }

  getHealthStatus() {
    const isHealthy = {
      database: this.metrics.database.connectionStatus === 'connected',
      memory: this.metrics.system.memoryUsage.heapUsed < (512 * 1024 * 1024), // < 512MB
      errors: this.metrics.errors.total < 100 // Arbitrary threshold
    };

    return {
      status: Object.values(isHealthy).every(Boolean) ? 'healthy' : 'unhealthy',
      checks: isHealthy,
      timestamp: new Date().toISOString()
    };
  }
}

// Global metrics collector instance
const metrics = new MetricsCollector();

// Performance monitoring middleware
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.recordRequest(req, res, duration);
    
    // Log slow requests
    if (duration > 1000) {
      Logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    // Try to ping the database
    await mongoose.connection.db.admin().ping();
    
    // Check if we can perform a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return {
      status: 'healthy',
      connectionState: mongoose.connection.readyState,
      collections: collections.length,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name
    };
  } catch (error) {
    Logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      connectionState: mongoose.connection.readyState
    };
  }
};

// Cloudinary health check
export const checkCloudinaryHealth = async () => {
  try {
    const { checkCloudinaryHealth: cloudinaryHealthCheck } = await import('../utils/cloudinary.js');
    
    // Use the health check function from cloudinary utility
    const result = await cloudinaryHealthCheck();
    
    metrics.metrics.externalServices.cloudinary = {
      status: 'healthy',
      lastCheck: new Date().toISOString()
    };
    
    return result;
  } catch (error) {
    metrics.metrics.externalServices.cloudinary = {
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
    
    Logger.error('Cloudinary health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
};

// Email service health check
export const checkEmailHealth = async () => {
  try {
    const emailService = (await import('../utils/emailService.js')).default;
    
    // Use the built-in health check method
    const result = await emailService.healthCheck();
    
    metrics.metrics.externalServices.email = {
      status: result.status,
      lastCheck: result.lastCheck
    };
    
    return result;
  } catch (error) {
    metrics.metrics.externalServices.email = {
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
    
    Logger.error('Email service health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
};

// Comprehensive health check
export const comprehensiveHealthCheck = async () => {
  const startTime = Date.now();
  
  try {
    const [database, cloudinary, email] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkCloudinaryHealth(),
      checkEmailHealth()
    ]);
    
    const healthReport = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      services: {
        database: database.status === 'fulfilled' ? database.value : { status: 'error', error: database.reason?.message },
        cloudinary: cloudinary.status === 'fulfilled' ? cloudinary.value : { status: 'error', error: cloudinary.reason?.message },
        email: email.status === 'fulfilled' ? email.value : { status: 'error', error: email.reason?.message }
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      metrics: metrics.getHealthStatus()
    };
    
    // Determine overall health status
    const unhealthyServices = Object.values(healthReport.services)
      .filter(service => service.status !== 'healthy').length;
    
    if (unhealthyServices > 0) {
      healthReport.status = unhealthyServices === Object.keys(healthReport.services).length ? 'critical' : 'degraded';
    }
    
    return healthReport;
  } catch (error) {
    Logger.error('Comprehensive health check failed', { error: error.message });
    return {
      status: 'critical',
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`
    };
  }
};

// Metrics endpoint handler
export const getMetrics = (req, res) => {
  try {
    const metricsData = metrics.getMetrics();
    
    res.json({
      success: true,
      data: metricsData,
      meta: {
        generatedAt: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  } catch (error) {
    Logger.error('Failed to get metrics', { 
      requestId: req.requestId, 
      error: error.message 
    });
    
    throw new ApiError(500, 'Failed to retrieve metrics');
  }
};

// Health check endpoint handler
export const healthCheck = async (req, res) => {
  try {
    const health = await comprehensiveHealthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status !== 'critical',
      data: health,
      meta: {
        requestId: req.requestId
      }
    });
  } catch (error) {
    Logger.error('Health check failed', { 
      requestId: req.requestId, 
      error: error.message 
    });
    
    res.status(503).json({
      success: false,
      data: {
        status: 'critical',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        requestId: req.requestId
      }
    });
  }
};

// Error tracking middleware
export const errorTracking = (err, req, res, next) => {
  // Record error metrics
  const category = err.category || 'UNKNOWN';
  metrics.recordError(category);
  
  next(err);
};

export { metrics, MetricsCollector }; 