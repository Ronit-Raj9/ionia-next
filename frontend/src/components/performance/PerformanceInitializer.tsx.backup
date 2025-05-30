'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring } from '@/lib/performance';
import { useAuthStore } from '@/stores/authStore';
import { preloadComponentsByRole } from './LazyComponents';
import { initializeCacheSystem } from '@/stores/cacheStore';

const PerformanceInitializer: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Initialize cache system
    initializeCacheSystem();
    
    console.log('Performance monitoring and caching initialized');
  }, []);

  useEffect(() => {
    // Preload components based on user role
    if (isAuthenticated && user?.role) {
      preloadComponentsByRole(user.role);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    // Setup performance observers for critical metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Log slow resources
            if (resourceEntry.duration > 1000) {
              console.warn('Slow resource detected:', {
                name: resourceEntry.name,
                duration: resourceEntry.duration,
                transferSize: resourceEntry.transferSize
              });
            }
          }
        });
      });
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('Resource observer not supported');
      }

      // Monitor navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            console.log('Navigation metrics:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              firstByte: navEntry.responseStart - navEntry.requestStart,
              domInteractive: navEntry.domInteractive - navEntry.navigationStart
            });
          }
        });
      });
      
      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Navigation observer not supported');
      }

      // Cleanup observers on unmount
      return () => {
        resourceObserver.disconnect();
        navigationObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    // Setup error boundary for global error tracking
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
      
      // Track error in performance store
      const { recordError } = require('@/lib/performance').usePerformanceStore.getState();
      recordError(new Error(`${event.message} at ${event.filename}:${event.lineno}`));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Track error in performance store
      const { recordError } = require('@/lib/performance').usePerformanceStore.getState();
      recordError(new Error(`Unhandled promise rejection: ${event.reason}`));
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    // Setup intersection observer for lazy loading optimization
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              lazyImageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      // Observe all images with data-src attribute
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach((img) => lazyImageObserver.observe(img));

      return () => {
        lazyImageObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    // Setup viewport optimization
    const optimizeViewport = () => {
      // Remove hover states on touch devices
      if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
      }

      // Optimize scrolling performance
      if (typeof window !== 'undefined') {
        let ticking = false;

        const updateScrollPosition = () => {
          // Update scroll position for performance optimizations
          const scrollTop = window.pageYOffset;
          const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = scrollTop / documentHeight;

          // Trigger preloading when user scrolls 75% down
          if (scrollPercent > 0.75) {
            const currentPath = window.location.pathname;
            if (currentPath === '/dashboard') {
              // Preload likely next sections
              import('@/components/dashboard/TestHistory');
              import('@/components/dashboard/PerformanceChart');
            }
          }

          ticking = false;
        };

        const handleScroll = () => {
          if (!ticking) {
            requestAnimationFrame(updateScrollPosition);
            ticking = true;
          }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
          window.removeEventListener('scroll', handleScroll);
        };
      }
    };

    optimizeViewport();
  }, []);

  useEffect(() => {
    // Memory usage monitoring
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const checkMemoryUsage = () => {
        const memory = (window.performance as any).memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };

        // Warn if memory usage is high
        const usagePercent = (memoryUsage.used / memoryUsage.limit) * 100;
        if (usagePercent > 80) {
          console.warn('High memory usage detected:', memoryUsage);
        }

        // Log memory usage periodically
        console.log('Memory usage:', memoryUsage);
      };

      // Check memory usage every 30 seconds
      const memoryInterval = setInterval(checkMemoryUsage, 30000);

      return () => {
        clearInterval(memoryInterval);
      };
    }
  }, []);

  useEffect(() => {
    // Connection monitoring
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const logConnectionInfo = () => {
        console.log('Connection info:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });

        // Adjust quality based on connection
        if (connection.saveData || connection.effectiveType === 'slow-2g') {
          document.body.classList.add('low-bandwidth');
        } else {
          document.body.classList.remove('low-bandwidth');
        }
      };

      logConnectionInfo();
      
      connection.addEventListener('change', logConnectionInfo);

      return () => {
        connection.removeEventListener('change', logConnectionInfo);
      };
    }
  }, []);

  // Component doesn't render anything
  return null;
};

export default PerformanceInitializer; 