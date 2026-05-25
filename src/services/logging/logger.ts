import { appEnv, isDevelopment, isProduction } from '@/lib/env'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogValue = string | number | boolean | null | undefined | LogObject | LogValue[]
type LogObject = { [key: string]: LogValue }

const SENSITIVE_KEY_PATTERN = /authorization|bearer|chat|conversation|cookie|file|password|secret|token/i
const MAX_STRING_LENGTH = 500
const MAX_ARRAY_ITEMS = 10
const MAX_OBJECT_KEYS = 20
const MAX_DEPTH = 3

const enabledLevelsByEnv: Record<string, Set<LogLevel>> = {
  development: new Set(['debug', 'info', 'warn', 'error']),
  staging: new Set(['info', 'warn', 'error']),
  production: new Set(['warn', 'error']),
}

function isLevelEnabled(level: LogLevel) {
  const enabledLevels = enabledLevelsByEnv[appEnv] ?? enabledLevelsByEnv.development
  return enabledLevels.has(level)
}

function truncate(value: string) {
  if (value.length <= MAX_STRING_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...`
}

function sanitizeValue(value: LogValue, depth = 0): LogValue | string {
  if (typeof value === 'string') {
    return truncate(value)
  }

  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (depth >= MAX_DEPTH) {
    return '[redacted:depth-limit]'
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1))
  }

  return Object.entries(value)
    .slice(0, MAX_OBJECT_KEYS)
    .reduce<LogObject>((sanitized, [key, item]) => {
      sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? '[redacted]'
        : sanitizeValue(item, depth + 1)
      return sanitized
    }, {})
}

function writeLog(level: LogLevel, message: string, context?: LogObject) {
  if (!isLevelEnabled(level)) {
    return
  }

  const sanitizedContext = context ? sanitizeValue(context) : undefined
  const args = sanitizedContext
    ? [`[${appEnv}] ${message}`, sanitizedContext]
    : [`[${appEnv}] ${message}`]

  if (isProduction && level === 'error') {
    console.error(...args)
    return
  }

  if (level === 'debug' && isDevelopment) {
    console.debug(...args)
    return
  }

  if (level === 'info') {
    console.info(...args)
    return
  }

  if (level === 'warn') {
    console.warn(...args)
    return
  }

  console.error(...args)
}

export const logger = {
  debug(message: string, context?: LogObject) {
    writeLog('debug', message, context)
  },
  info(message: string, context?: LogObject) {
    writeLog('info', message, context)
  },
  warn(message: string, context?: LogObject) {
    writeLog('warn', message, context)
  },
  error(message: string, context?: LogObject) {
    writeLog('error', message, context)
  },
}

export function sanitizeLogContext(context: LogObject) {
  return sanitizeValue(context) as LogObject
}
