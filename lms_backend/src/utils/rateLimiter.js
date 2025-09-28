// Simple in-memory rate limiter
// In production, use Redis or a proper rate limiting service
const requestCounts = new Map();
const windowMs = 15 * 60 * 1000; // 15 minutes

export const rateLimiter = {
  // Rate limiting rules
  rules: {
    login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
    api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    question: { windowMs: 60 * 1000, max: 10 } // 10 questions per minute
  },
  
  // Check if request is allowed
  isAllowed: (identifier, ruleName = 'api') => {
    const rule = rateLimiter.rules[ruleName];
    if (!rule) return true;
    
    const now = Date.now();
    const key = `${identifier}:${ruleName}`;
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetTime: now + rule.windowMs });
      return true;
    }
    
    const record = requestCounts.get(key);
    
    // Reset if window has passed
    if (now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + rule.windowMs });
      return true;
    }
    
    // Check if limit exceeded
    if (record.count >= rule.max) {
      return false;
    }
    
    // Increment count
    record.count++;
    return true;
  },
  
  // Get remaining requests
  getRemaining: (identifier, ruleName = 'api') => {
    const rule = rateLimiter.rules[ruleName];
    if (!rule) return rule.max;
    
    const key = `${identifier}:${ruleName}`;
    const record = requestCounts.get(key);
    
    if (!record) return rule.max;
    
    const now = Date.now();
    if (now > record.resetTime) {
      return rule.max;
    }
    
    return Math.max(0, rule.max - record.count);
  },
  
  // Get reset time
  getResetTime: (identifier, ruleName = 'api') => {
    const key = `${identifier}:${ruleName}`;
    const record = requestCounts.get(key);
    
    if (!record) return null;
    
    const now = Date.now();
    if (now > record.resetTime) {
      return null;
    }
    
    return new Date(record.resetTime);
  },
  
  // Clear rate limit for identifier
  clear: (identifier, ruleName = 'api') => {
    const key = `${identifier}:${ruleName}`;
    requestCounts.delete(key);
  },
  
  // Get stats
  getStats: () => {
    const stats = {
      totalKeys: requestCounts.size,
      rules: Object.keys(rateLimiter.rules),
      activeLimits: []
    };
    
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now <= record.resetTime) {
        const [identifier, ruleName] = key.split(':');
        stats.activeLimits.push({
          identifier,
          ruleName,
          count: record.count,
          resetTime: new Date(record.resetTime)
        });
      }
    }
    
    return stats;
  }
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes
