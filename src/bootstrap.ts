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

export function startupFailureLanguage(language?: string): StartupFailureLanguage {
  const code = (language ?? browserLanguage()).slice(0, 2).toLowerCase()
  return code in STARTUP_FAILURE_MESSAGES ? code as StartupFailureLanguage : 'en'
}

export function startupFailureMessage(language?: string): string {
  return STARTUP_FAILURE_MESSAGES[startupFailureLanguage(language)]
}

function browserLanguage(): string {
  const candidate = (globalThis as { navigator?: { language?: unknown } }).navigator?.language
  return typeof candidate === 'string' ? candidate : 'en'
}

/**
 * Two budgets, not one (#344). Proving the release is two small same-origin
 * documents, and ten seconds is long for them. Loading the application is the
 * first-screen code, which on a slow connection can take longer than that while
 * nothing is wrong - so it has its own, longer budget instead of eating into the
 * first one.
 *
 * Running out of either only puts the failure text up. It does not stop the
 * start: if the load finishes after all, the application mounts over the text.
 * A step that fails outright still stops it.
 */
const DEFAULT_STARTUP_TIMEOUT_MS = 10_000
const MAX_STARTUP_TIMEOUT_MS = 30_000
const DEFAULT_APPLICATION_TIMEOUT_MS = 30_000
const MAX_APPLICATION_TIMEOUT_MS = 120_000

export interface StartupFailureTarget {
  textContent: string | null
  setAttribute(name: string, value: string): void
  removeAttribute?(name: string): void
  readonly ownerDocument?: { readonly documentElement: { lang: string } } | null
}

export type ApplicationStarter = () => void | Promise<void>

export interface WebStartupOptions {
  readonly webOrigin: string
  readonly loadApplication: () => Promise<ApplicationStarter>
  readonly renderFailure: () => void
  /** Takes the failure text down again when a slow start finishes after all. */
  readonly clearFailure?: () => void
  /** Budget for proving the release: the descriptor and the config it names. */
  readonly timeoutMs?: number
  /** Budget for loading the application code once the release is proven. */
  readonly applicationTimeoutMs?: number
}

type StartupState = 'idle' | 'starting' | 'started' | 'failed'

class StartupAttemptStopped extends Error {}

let startupState: StartupState = 'idle'
let activeFailureRenderer: (() => void) | undefined
let failureRendered = false

function ensureStarting(): void {
  if (startupState !== 'starting') throw new StartupAttemptStopped()
}

function showFailure(): void {
  if (failureRendered) return
  failureRendered = true
  activeFailureRenderer?.()
}

function failStartup(): false {
  startupState = 'failed'
  showFailure()
  return false
}

function budget(value: number | undefined, fallback: number, max: number): number {
  if (value === undefined) return fallback
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.min(value, max)
}

/** Puts the failure text up if `work` has not settled within `ms`; never stops it. */
async function withinBudget<T>(work: () => Promise<T>, ms: number): Promise<T> {
  const timer = setTimeout(() => {
    if (startupState === 'starting') showFailure()
  }, ms)
  try {
    return await work()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * A config that is well formed but belongs to another release than the
 * descriptor names. With the digest-named config a publish writes now this
 * cannot happen; with the fixed name an older publish wrote, it did for every
 * visitor between two uploads (#344). Asking for the descriptor once more gets
 * the pair that is being served now. Read by code, not by class: this file
 * imports the loader and nothing else from the config module.
 */
function isReleaseMismatch(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code
  return code === 'runtime_config_digest_mismatch' || code === 'runtime_config_release_mismatch'
}

async function proveRelease(webOrigin: string): Promise<void> {
  const attempt = async () => {
    const descriptor = await loadServedRelease({ webOrigin })
    ensureStarting()

    const runtimeOptions = toRuntimeConfigLoadOptions(descriptor, {
      expectedWebOrigin: webOrigin,
    })
    ensureStarting()

    await initializeRuntimeConfig(runtimeOptions)
    ensureStarting()
  }
  try {
    await attempt()
  } catch (error) {
    if (!isReleaseMismatch(error)) throw error
    ensureStarting()
    await attempt()
  }
}

async function runStartup(options: WebStartupOptions): Promise<void> {
  await withinBudget(
    () => proveRelease(options.webOrigin),
    budget(options.timeoutMs, DEFAULT_STARTUP_TIMEOUT_MS, MAX_STARTUP_TIMEOUT_MS),
  )

  const startApplication = await withinBudget(
    () => options.loadApplication(),
    budget(options.applicationTimeoutMs, DEFAULT_APPLICATION_TIMEOUT_MS, MAX_APPLICATION_TIMEOUT_MS),
  )
  ensureStarting()

  if (failureRendered) {
    failureRendered = false
    options.clearFailure?.()
  }
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

  return runStartup(options).then(
    () => {
      if (startupState !== 'starting') return false
      startupState = 'started'
      return true
    },
    () => failStartup(),
  )
}

export function renderStartupFailure(
  target: StartupFailureTarget | null,
  language?: string,
): void {
  if (target === null) return
  const chosen = startupFailureLanguage(language)
  target.textContent = STARTUP_FAILURE_MESSAGES[chosen]
  target.setAttribute('role', 'alert')
  target.setAttribute('aria-live', 'assertive')
  // index.html says `en`; a screen reader reading the German sentence as
  // English is as lost as the family was with the Chinese one (#344).
  const root = target.ownerDocument?.documentElement
  if (root) root.lang = chosen
}

/**
 * Takes the failure text down when a start that ran out of time finishes after
 * all. The page language is set again by the application's own start.
 */
export function clearStartupFailure(target: StartupFailureTarget | null): void {
  if (target === null) return
  target.textContent = ''
  target.removeAttribute?.('role')
  target.removeAttribute?.('aria-live')
}
