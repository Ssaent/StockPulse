/**
 * @fileoverview Main entry point for StockPulse React Application
 *
 * This file bootstraps the React application with enterprise-grade
 * error handling, performance monitoring, and development safeguards.
 *
 * @author StockPulse Team
 * @version 1.0.0
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

// Internal imports
import App from './App.jsx'
import './index.css'

// Configuration
import { config } from './config/client.js'

// Utils
import { logger } from './utils/logger.js'
import { performanceMonitor } from './utils/performance.js'

/**
 * Global error fallback component for unhandled React errors
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  logger.error('Critical React Error:', error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-4">
          We're sorry, but something unexpected happened.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

/**
 * Service Worker Registration for PWA capabilities
 */
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && config.features.enableServiceWorker) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      logger.info('Service Worker registered:', registration.scope)
    } catch (error) {
      logger.error('Service Worker registration failed:', error)
    }
  }
}

/**
 * Initialize third-party services and monitoring
 */
const initializeServices = () => {
  // Sentry error tracking (only in production)
  if (config.isProduction && config.features.enableErrorTracking && config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      integrations: [new BrowserTracing()],
      tracesSampleRate: config.sentry.tracesSampleRate,
      environment: config.environment,
      release: config.version,
    })
    logger.info('Sentry initialized')
  }

  // Register service worker for PWA
  registerServiceWorker()
}

/**
 * Environment validation for production safety
 */
const validateEnvironment = () => {
  const requiredEnvVars = ['VITE_API_URL']

  if (config.isProduction) {
    // In production, require essential environment variables
    const missing = requiredEnvVars.filter(key => !import.meta.env[key])
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  return true
}

/**
 * Bootstrap the React application
 */
const bootstrap = () => {
  try {
    // Validate environment before proceeding
    validateEnvironment()

    // Initialize external services
    initializeServices()

    // Get the root DOM element
    const rootElement = document.getElementById('root')

    if (!rootElement) {
      throw new Error('Root element not found. Make sure index.html contains <div id="root"></div>')
    }

    // Create React root with concurrent features
    const root = ReactDOM.createRoot(rootElement)

    // Log app startup
    logger.info('StockPulse application starting...', {
      version: config.version,
      environment: config.environment,
      timestamp: new Date().toISOString()
    })

    // Render the application with error boundaries
    root.render(
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          logger.error('React Error Boundary caught an error:', error, errorInfo)
        }}
        onReset={() => {
          logger.info('Error boundary reset triggered')
        }}
      >
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </ErrorBoundary>
    )

    logger.info('StockPulse application successfully mounted')

  } catch (error) {
    logger.error('Failed to bootstrap application:', error)

    // Fallback rendering for critical errors
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 2rem; text-align: center; font-family: system-ui;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Failed to Start</h1>
          <p style="color: #6b7280;">Please refresh the page or contact support.</p>
          <details style="margin-top: 1rem; text-align: left;">
            <summary style="cursor: pointer; color: #374151;">Error Details</summary>
            <pre style="background: #f3f4f6; padding: 1rem; margin-top: 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; overflow-x: auto;">${error.message}</pre>
          </details>
        </div>
      `
    }
  }
}

// Start the application
bootstrap()