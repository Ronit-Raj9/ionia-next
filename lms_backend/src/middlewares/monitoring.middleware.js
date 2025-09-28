// Performance Monitoring Middleware
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    // Store metrics (in a real app, you'd send this to a monitoring service)
    if (global.metrics) {
      global.metrics.requestDuration.observe({ method: req.method, route: req.route?.path }, duration);
      global.metrics.requestCount.inc({ method: req.method, status: res.statusCode });
    }
  });
  
  next();
};

// Health Check Endpoint
export const healthCheck = (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json({
    success: true,
    data: healthData,
    message: 'LMS service is healthy'
  });
};

// Metrics Endpoint
export const getMetrics = (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json({
    success: true,
    data: metrics,
    message: 'LMS service metrics'
  });
};

// Error Tracking Middleware
export const errorTracking = (err, req, res, next) => {
  // In a real application, you would send this to an error tracking service
  // like Sentry, LogRocket, or DataDog
  
  const errorData = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    },
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : null
  };
  
  // Log error for monitoring
  console.error('Error tracked:', JSON.stringify(errorData, null, 2));
  
  // Update error metrics
  if (global.metrics) {
    global.metrics.errorCount.inc({ 
      error_type: err.name || 'Unknown',
      route: req.route?.path || req.originalUrl 
    });
  }
  
  next(err);
};
