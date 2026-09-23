import {
  loadServedRelease,
  toRuntimeConfigLoadOptions,
} from '@/lib/servedRelease'
import { initializeRuntimeConfig } from '@/lib/runtimeConfig'

/**
 * What a person sees when the application cannot start.
 *
 * This renders before i18next exists, so it cannot be a translation key - which
 * is how it came to be one fixed string in a language this platform does not
 * serve. A German family reading a Chinese sentence learns nothing from it. The
 * language is picked from the browser here, the same four the platform serves,
 * and English is the fallback.
 *
 * Every one of these says the same thing and nothing more: it did not start,
 * reload, and if it keeps happening ask support. No address, no identifier, no
 * word about what failed.
 */
const STARTUP_FAILURE_MESSAGES = {
  de: 'Die Anwendung kann im Moment nicht starten. Bitte laden Sie die Seite neu; wenn es weiterhin nicht klappt, wenden Sie sich an den Support.',
  en: 'The application cannot start right now. Please reload the page; if it keeps happening, contact support.',
  fr: 'L’application ne peut pas démarrer pour le moment. Veuillez recharger la page ; si cela persiste, contactez le support.',
  it: 'L’applicazione non riesce ad avviarsi al momento. Ricarica la pagina; se il problema persiste, contatta il supporto.',
} as const

export type StartupFailureLanguage = keyof typeof STARTUP_FAILURE_MESSAGES

export function startupFailureMessage(language?: string): string {
  const code = (language ?? browserLanguage()).slice(0, 2).toLowerCase()
  return code in STARTUP_FAILURE_MESSAGES
    ? STARTUP_FAILURE_MESSAGES[code as StartupFailureLanguage]
    : STARTUP_FAILURE_MESSAGES.en
}

function browserLanguage(): string {
  const candidate = (globalThis as { navigator?: { language?: unknown } }).navigator?.language
  return typeof candidate === 'string' ? candidate : 'en'
}

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

export function renderStartupFailure(
  target: StartupFailureTarget | null,
  language?: string,
): void {
  if (target === null) return
  target.textContent = startupFailureMessage(language)
  target.setAttribute('role', 'alert')
  target.setAttribute('aria-live', 'assertive')
}
