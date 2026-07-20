import { appEnv } from '@/lib/env'
import { getRuntimeConfig } from '@/lib/runtimeConfig'
import { httpClient } from '@/services/api/httpClient'
import { logger } from '@/services/logging'

type FrontendErrorSource = 'app-error-boundary' | 'manual'

export type FrontendErrorContext = {
  source?: FrontendErrorSource
  componentStack?: string | null
}

type FrontendErrorPayload = {
  appEnv: string
  componentStack?: string
  errorId: string
  message: string
  name: string
  route: string
  source: FrontendErrorSource
  stack?: string
  timestamp: string
}

const MONITORING_ENDPOINT = '/monitoring/frontend-errors'
const MAX_MESSAGE_LENGTH = 500
const MAX_STACK_FRAMES = 8
const MAX_STACK_FRAME_LENGTH = 300
const SENSITIVE_TEXT_PATTERN =
  /(authorization|bearer|chat|conversation|cookie|file|password|secret|token)\s*[:=]/i
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
const BEARER_PATTERN = /bearer\s+[A-Za-z0-9._~+/=-]+/gi

function isMonitoringEnabled() {
  try {
    return getRuntimeConfig().features.errorMonitoring
  } catch {
    return false
  }
}

function buildErrorId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return 'unknown'
  }

  return window.location.pathname || '/'
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength)}...`
}

function sanitizeText(value: string, fallback: string) {
  const withoutSecrets = value.replace(JWT_PATTERN, '[redacted-token]').replace(BEARER_PATTERN, 'Bearer [redacted-token]')

  if (SENSITIVE_TEXT_PATTERN.test(withoutSecrets)) {
    return fallback
  }

  return truncate(withoutSecrets, MAX_MESSAGE_LENGTH)
}

function sanitizeStack(stack?: string | null) {
  if (!stack) {
    return undefined
  }

  const sanitizedFrames = stack
    .replace(JWT_PATTERN, '[redacted-token]')
    .replace(BEARER_PATTERN, 'Bearer [redacted-token]')
    .split('\n')
    .filter((line) => !SENSITIVE_TEXT_PATTERN.test(line))
    .slice(0, MAX_STACK_FRAMES)
    .map((line) => truncate(line.replace(/\?.*$/u, ''), MAX_STACK_FRAME_LENGTH))

  if (sanitizedFrames.length === 0) {
    return undefined
  }

  return sanitizedFrames.join('\n')
}

function buildFrontendErrorPayload(error: Error, context: FrontendErrorContext = {}): FrontendErrorPayload {
  return {
    appEnv,
    componentStack: sanitizeStack(context.componentStack),
    errorId: buildErrorId(),
    message: sanitizeText(error.message || 'Unknown frontend error', 'Error message redacted'),
    name: sanitizeText(error.name || 'Error', 'Error'),
    route: getCurrentRoute(),
    source: context.source ?? 'manual',
    stack: sanitizeStack(error.stack),
    timestamp: new Date().toISOString(),
  }
}

export async function reportFrontendError(error: Error, context: FrontendErrorContext = {}) {
  if (!isMonitoringEnabled()) {
    logger.debug('Frontend error monitoring skipped', {
      appEnv,
      route: getCurrentRoute(),
      source: context.source ?? 'manual',
    })
    return
  }

  const payload = buildFrontendErrorPayload(error, context)

  try {
    await httpClient.post(MONITORING_ENDPOINT, payload)
  } catch (reportingError) {
    logger.warn('Frontend error monitoring report failed', {
      appEnv,
      errorName: reportingError instanceof Error ? reportingError.name : 'UnknownError',
      route: payload.route,
      source: payload.source,
    })
  }
}

export const frontendErrorMonitoring = {
  reportError: reportFrontendError,
}
