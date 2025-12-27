/**
 * @fileoverview Performance monitoring utility for StockPulse
 *
 * Provides comprehensive performance tracking including Core Web Vitals,
 * custom metrics, and performance budgets.
 */

import React from 'react';
import { config } from '../config/client.js';
import { logger } from './logger.js';

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
    this.isStarted = false;
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isStarted) {
      logger.warn('Performance monitoring already started');
      return;
    }

    this.isStarted = true;
    logger.lifecycle('Performance monitoring started');

    // Start Core Web Vitals tracking
    this.trackWebVitals();

    // Start custom performance metrics
    this.trackCustomMetrics();

    // Track navigation timing
    this.trackNavigationTiming();

    // Track resource loading
    this.trackResourceTiming();
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    this.isStarted = false;
    this.metrics.clear();
    this.observers.clear();
    logger.lifecycle('Performance monitoring stopped');
  }

  /**
   * Track Core Web Vitals using web-vitals library
   */
  async trackWebVitals() {
    if (!config.performance.enableWebVitals) {
      return;
    }

    try {
      // Dynamically import web-vitals to avoid bundle size in development
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

      // Core Web Vitals
      getCLS(this.handleWebVital.bind(this, 'CLS'));
      getFID(this.handleWebVital.bind(this, 'FID'));
      getFCP(this.handleWebVital.bind(this, 'FCP'));
      getLCP(this.handleWebVital.bind(this, 'LCP'));
      getTTFB(this.handleWebVital.bind(this, 'TTFB'));

      logger.info('Core Web Vitals tracking initialized');

    } catch (error) {
      logger.warn('Failed to initialize web-vitals tracking:', error);
    }
  }

  /**
   * Handle Web Vital measurements
   */
  handleWebVital(name, metric) {
    const value = Math.round(name === 'CLS' ? metric.value * 1000 : metric.value);

    this.recordMetric(`web-vitals.${name}`, value, {
      rating: metric.rating,
      delta: metric.delta,
      entries: metric.entries,
    });

    // Log performance issues
    if (metric.rating === 'poor') {
      logger.warn(`Poor ${name} performance: ${value}`, {
        metric: name,
        value,
        rating: metric.rating,
        performance: true,
      });
    } else {
      logger.debug(`${name} performance: ${value}`, {
        metric: name,
        value,
        rating: metric.rating,
        performance: true,
      });
    }

    // Report to external service if enabled
    if (config.performance.reportWebVitals) {
      this.reportToExternalService(name, metric);
    }
  }

  /**
   * Track custom performance metrics
   */
  trackCustomMetrics() {
    // Track React render performance
    this.trackReactPerformance();

    // Track route changes
    this.trackRouteChanges();

    // Track API call performance
    this.trackApiPerformance();

    // Track user interaction performance
    this.trackInteractionPerformance();
  }

  /**
   * Track React component render performance
   */
  trackReactPerformance() {
    if (!window.React || !window.React.Profiler) {
      return;
    }

    // Global React Profiler callback
    window.reactProfilerCallback = (id, phase, actualDuration, baseDuration) => {
      if (actualDuration > baseDuration * 2) {
        logger.warn(`Slow React render: ${id}`, {
          component: id,
          phase,
          actualDuration,
          baseDuration,
          performance: true,
        });
      }

      this.recordMetric(`react-render.${id}`, actualDuration, {
        phase,
        baseDuration,
        slowRender: actualDuration > baseDuration * 2,
      });
    };
  }

  /**
   * Track navigation timing
   */
  trackNavigationTiming() {
    if (!window.performance || !window.performance.timing) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const navigationStart = timing.navigationStart;

        const metrics = {
          'navigation.domContentLoaded': timing.domContentLoadedEventEnd - navigationStart,
          'navigation.loadComplete': timing.loadEventEnd - navigationStart,
          'navigation.firstPaint': this.getFirstPaintTime(),
          'navigation.domInteractive': timing.domInteractive - navigationStart,
          'navigation.domComplete': timing.domComplete - navigationStart,
        };

        Object.entries(metrics).forEach(([key, value]) => {
          if (value > 0) {
            this.recordMetric(key, value);
            logger.debug(`${key}: ${value}ms`);
          }
        });
      }, 0);
    });
  }

  /**
   * Get First Paint time
   */
  getFirstPaintTime() {
    if (!window.performance || !window.performance.getEntriesByType) {
      return 0;
    }

    const paintEntries = window.performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');

    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Track resource loading performance
   */
  trackResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    // Track resource timing after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = window.performance.getEntriesByType('resource');

        resources.forEach(resource => {
          if (resource.duration > 1000) { // Log slow resources (>1s)
            logger.warn(`Slow resource: ${resource.name}`, {
              url: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
              type: resource.initiatorType,
              performance: true,
            });
          }

          this.recordMetric(`resource.${resource.initiatorType}`, resource.duration, {
            url: resource.name,
            size: resource.transferSize,
          });
        });
      }, 1000);
    });
  }

  /**
   * Track route changes performance
   */
  trackRouteChanges() {
    // This would integrate with React Router to track route change performance
    let lastRouteChange = Date.now();

    const originalHistoryPush = window.history.pushState;
    window.history.pushState = (...args) => {
      const routeChangeTime = Date.now() - lastRouteChange;
      logger.performance('Route change', routeChangeTime, {
        from: window.location.pathname,
        to: args[2],
      });

      lastRouteChange = Date.now();
      return originalHistoryPush.apply(window.history, args);
    };
  }

  /**
   * Track API call performance
   */
  trackApiPerformance() {
    // This would be integrated with your API client
    // For now, we'll track using Performance API
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    // Monitor fetch/XHR requests
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('/api/') && entry.duration > 500) {
          logger.warn(`Slow API call: ${entry.name}`, {
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            performance: true,
          });
        }

        this.recordMetric('api-call', entry.duration, {
          url: entry.name,
          method: entry.initiatorType,
        });
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Track user interaction performance
   */
  trackInteractionPerformance() {
    // Track long tasks (>50ms)
    if (!window.PerformanceObserver) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          logger.warn(`Long task detected: ${entry.duration}ms`, {
            startTime: entry.startTime,
            duration: entry.duration,
            performance: true,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, context = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.set(name, metric);

    // Notify observers
    this.observers.forEach(observer => {
      try {
        observer(metric);
      } catch (error) {
        logger.error('Performance observer error:', error);
      }
    });

    return metric;
  }

  /**
   * Get a recorded metric
   */
  getMetric(name) {
    return this.metrics.get(name);
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  /**
   * Add a metric observer
   */
  addObserver(callback) {
    this.observers.add(callback);
  }

  /**
   * Remove a metric observer
   */
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  /**
   * Report metrics to external service
   */
  reportToExternalService(name, data) {
    // This would send metrics to services like DataDog, New Relic, etc.
    if (config.isProduction && config.features.enablePerformanceMonitoring) {
      try {
        // Placeholder for external reporting
        logger.debug(`Reporting ${name} to external service`, data);
      } catch (error) {
        logger.error('Failed to report metrics:', error);
      }
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(name, context = {}) {
    const startTime = Date.now();

    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.recordMetric(`timer.${name}`, duration, context);
        logger.performance(name, duration, context);
        return duration;
      },
    };
  }

  /**
   * Measure function execution time
   */
  measureFunction(fn, name, context = {}) {
    return (...args) => {
      const timer = this.startTimer(name, context);
      try {
        const result = fn(...args);
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };
  }
}

/**
 * Export singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Utility function to measure async function performance
 */
export const measureAsync = async (fn, name, context = {}) => {
  const timer = performanceMonitor.startTimer(name, context);
  try {
    const result = await fn();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
};

/**
 * Hook for measuring component render performance
 */
export const usePerformanceMeasurement = (componentName) => {
  const renderTimer = performanceMonitor.startTimer(`${componentName}.render`);

  React.useEffect(() => {
    return () => {
      renderTimer.end();
    };
  });

  return {
    measureAsync: (fn, operation) =>
      measureAsync(fn, `${componentName}.${operation}`),
    measureSync: (fn, operation) =>
      performanceMonitor.measureFunction(fn, `${componentName}.${operation}`),
  };
};

export default performanceMonitor;
