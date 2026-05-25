import { isDevelopment } from '@/lib/env'

export async function withDemoFallback<T>(request: () => Promise<T>, fallback: T | (() => T)): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (isDevelopment) {
      console.info('[demo-api] using mock response', error)
    }

    return typeof fallback === 'function' ? (fallback as () => T)() : fallback
  }
}
