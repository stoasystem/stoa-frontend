import { allowDemoFallback, apiMode, isDevelopment } from '@/lib/env'

export async function withDemoFallback<T>(request: () => Promise<T>, fallback: T | (() => T)): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (!allowDemoFallback || !shouldUseDemoFallback(error)) {
      throw error
    }

    if (isDevelopment) {
      console.info('[demo-api] using mock response', error)
    }

    return typeof fallback === 'function' ? (fallback as () => T)() : fallback
  }
}

function shouldUseDemoFallback(error: unknown) {
  if (apiMode === 'mock') return true
  const responseStatus = getResponseStatus(error)
  return responseStatus === undefined
}

function getResponseStatus(error: unknown) {
  if (typeof error !== 'object' || error === null) return undefined
  const response = 'response' in error ? error.response : undefined
  if (typeof response !== 'object' || response === null) return undefined
  const status = 'status' in response ? response.status : undefined
  return typeof status === 'number' ? status : undefined
}
