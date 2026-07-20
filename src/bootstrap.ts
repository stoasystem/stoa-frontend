import {
  loadServedRelease,
  toRuntimeConfigLoadOptions,
} from '@/lib/servedRelease'
import { initializeRuntimeConfig } from '@/lib/runtimeConfig'

export const STARTUP_FAILURE_MESSAGE =
  '应用暂时无法启动，请刷新重试；问题持续请联系支持。'

const DEFAULT_STARTUP_TIMEOUT_MS = 10_000
const MAX_STARTUP_TIMEOUT_MS = 30_000

export interface StartupFailureTarget {
  textContent: string | null
  setAttribute(name: string, value: string): void
}

export type ApplicationStarter = () => void | Promise<void>

export interface WebStartupOptions {
  readonly webOrigin: string
  readonly loadApplication: () => Promise<ApplicationStarter>
  readonly renderFailure: () => void
  readonly timeoutMs?: number
}

type StartupState = 'idle' | 'starting' | 'started' | 'failed'

class StartupAttemptStopped extends Error {}

let startupState: StartupState = 'idle'
let activeFailureRenderer: (() => void) | undefined
let failureRendered = false

function ensureStarting(): void {
  if (startupState !== 'starting') throw new StartupAttemptStopped()
}

function failStartup(): false {
  startupState = 'failed'
  if (!failureRendered) {
    failureRendered = true
    activeFailureRenderer?.()
  }
  return false
}

function startupTimeout(value: number | undefined): number {
  if (value === undefined) return DEFAULT_STARTUP_TIMEOUT_MS
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_STARTUP_TIMEOUT_MS
  return Math.min(value, MAX_STARTUP_TIMEOUT_MS)
}

async function runStartup(options: WebStartupOptions): Promise<void> {
  const descriptor = await loadServedRelease({ webOrigin: options.webOrigin })
  ensureStarting()

  const runtimeOptions = toRuntimeConfigLoadOptions(descriptor, {
    expectedWebOrigin: options.webOrigin,
  })
  ensureStarting()

  await initializeRuntimeConfig(runtimeOptions)
  ensureStarting()

  const startApplication = await options.loadApplication()
  ensureStarting()

  await startApplication()
  ensureStarting()
}

export function startWebApplication(options: WebStartupOptions): Promise<boolean> {
  if (startupState !== 'idle') {
    failStartup()
    return Promise.resolve(false)
  }

  startupState = 'starting'
  activeFailureRenderer = options.renderFailure
  failureRendered = false

  const operation = runStartup(options)
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      failStartup()
      resolve(false)
    }, startupTimeout(options.timeoutMs))

    void operation.then(
      () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (startupState !== 'starting') {
          resolve(false)
          return
        }
        startupState = 'started'
        resolve(true)
      },
      () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(failStartup())
      },
    )
  })
}

export function renderStartupFailure(target: StartupFailureTarget | null): void {
  if (target === null) return
  target.textContent = STARTUP_FAILURE_MESSAGE
  target.setAttribute('role', 'alert')
  target.setAttribute('aria-live', 'assertive')
}
