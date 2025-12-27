/**
 * @fileoverview Client-side configuration for StockPulse
 *
 * This file contains all client-side configuration values including
 * API endpoints, feature flags, and third-party service configurations.
 * Values are sourced from environment variables for security and flexibility.
 */

/**
 * Application configuration object
 */
export const config = {
  // Application metadata
  name: 'StockPulse',
  version: '1.0.0',
  description: 'AI-Powered Stock Analysis Platform',

  // Environment
  environment: import.meta.env.MODE || 'development',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,

  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // Feature flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
    enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
    enableChat: true,
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  },

  // Third-party services
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'),
    replaysOnErrorSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'),
  },

  // Analytics configuration
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GA_ID,
    mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN,
  },

  // Performance monitoring
  performance: {
    enableWebVitals: true,
    reportWebVitals: import.meta.env.VITE_REPORT_WEB_VITALS === 'true',
  },

  // UI Configuration
  ui: {
    theme: 'dark',
    animations: {
      enableTransitions: true,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
  },

  // Market data configuration
  market: {
    refreshInterval: {
      open: 3000, // 3 seconds when market is open
      closed: 30000, // 30 seconds when market is closed
    },
    timezone: 'Asia/Kolkata',
    marketHours: {
      open: '09:15',
      close: '15:30',
    },
  },

  // Chat configuration
  chat: {
    maxMessageLength: 1000,
    messageHistoryLimit: 50,
    typingTimeout: 3000,
  },

  // Development configuration
  dev: {
    enableReduxDevTools: import.meta.env.DEV,
    enableReactQueryDevTools: import.meta.env.DEV,
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  },
};

/**
 * Validate configuration in production
 */
export const validateConfig = () => {
  const requiredVars = [];

  if (config.isProduction) {
    // In production, require essential environment variables
    if (config.features.enableErrorTracking && !config.sentry.dsn) {
      requiredVars.push('VITE_SENTRY_DSN');
    }

    if (!config.api.baseURL.includes('localhost') && !config.api.baseURL.startsWith('https://')) {
      throw new Error('Production API URL must use HTTPS');
    }
  }

  if (requiredVars.length > 0) {
    throw new Error(`Missing required environment variables: ${requiredVars.join(', ')}`);
  }

  return true;
};

/**
 * Get configuration value with fallback
 */
export const getConfigValue = (path, fallback = null) => {
  const keys = path.split('.');
  let value = config;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      return fallback;
    }
  }

  return value;
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  return getConfigValue(`features.${featureName}`, false);
};

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  return {
    isProduction: config.isProduction,
    isDevelopment: config.isDevelopment,
    environment: config.environment,
    apiURL: config.api.baseURL,
  };
};

export default config;
