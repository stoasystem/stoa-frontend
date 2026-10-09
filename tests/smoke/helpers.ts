import { expect, type Page, type Request, type Response } from '@playwright/test'
import { smokeAccounts, smokePassword, type SmokeRole } from './accounts'

/**
 * A failure is written `<status> <METHOD> <path>`, with `failed` for a request
 * that never got an answer and ` error=<...>` after a 2xx whose body said it
 * failed anyway. The shape is what `ExpectedApiFailure` is matched against.
 */
export type ApiFailureStatus = number | 'failed'

/**
 * One refusal a test asks for on purpose - a 403, 401, 422 or the 404 control.
 *
 * It names the request, not only the status: a 403 on the path the test
 * expects is consumed, a 403 anywhere else is still a failure. Each entry is
 * consumed `times` times (default once) and, unless `optional`, has to have
 * been seen, so a refusal that never came is reported too.
 */
export type ExpectedApiFailure = {
  method: string
  path: string | RegExp
  status: ApiFailureStatus
  why: string
  times?: number
  optional?: boolean
}

/** API hosts are `api.` / `api-` (production, staging, the offline mock); `/api/` paths too. */
export function isApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return /^api[.-]/.test(parsed.hostname) || parsed.pathname === '/api' || parsed.pathname.startsWith('/api/')
  } catch {
    return false
  }
}

export function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url.split('?')[0]
  }
}

/**
 * The `error` a 2xx body carries when the server answered "OK" and failed.
 *
 * Only a top-level `error` that holds something counts: `error: null` is the
 * common way of saying there was none.
 */
export function bodyError(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  if (!Object.prototype.hasOwnProperty.call(body, 'error')) return null
  const value = (body as Record<string, unknown>).error
  if (value === null || value === undefined) return null
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.slice(0, 120)
}

/** What a watched response or `SmokeApi` call amounts to: `null` when it is usable. */
export function describeApiFailure(observed: {
  status: number
  method: string
  url: string
  body?: unknown
}): string | null {
  const where = `${observed.method.toUpperCase()} ${pathOf(observed.url)}`
  if (observed.status >= 400) return `${observed.status} ${where}`
  const error = bodyError(observed.body)
  return error === null ? null : `${observed.status} ${where} error=${error}`
}

function parseFailure(failure: string): { status: ApiFailureStatus; method: string; path: string } | null {
  const match = /^(\d{3}|failed) (\S+) (\S+)/.exec(failure)
  if (!match) return null
  return {
    status: match[1] === 'failed' ? 'failed' : Number(match[1]),
    method: match[2],
    path: match[3],
  }
}

function describeExpected(expected: ExpectedApiFailure): string {
  return `${expected.status} ${expected.method.toUpperCase()} ${String(expected.path)} (${expected.why})`
}

/**
 * Split observed failures into the ones a test asked for and the rest.
 *
 * A 2xx carrying `error` is never an expected refusal, whatever its path.
 */
export function reconcileApiFailures(
  failures: readonly string[],
  expected: readonly ExpectedApiFailure[] = [],
): { unexpected: string[]; unmet: string[] } {
  const used = expected.map(() => 0)
  const unexpected: string[] = []
  for (const failure of failures) {
    const parsed = parseFailure(failure)
    const index = parsed && !failure.includes(' error=')
      ? expected.findIndex((entry, i) =>
        used[i] < (entry.times ?? 1) &&
        entry.status === parsed.status &&
        entry.method.toUpperCase() === parsed.method &&
        (typeof entry.path === 'string' ? entry.path === parsed.path : entry.path.test(parsed.path)))
      : -1
    if (index === -1) {
      unexpected.push(failure)
    } else {
      used[index] += 1
    }
  }
  const unmet = expected
    .filter((entry, i) => !entry.optional && used[i] === 0)
    .map(describeExpected)
  return { unexpected, unmet }
}

// Body reads finish after the response event; a check has to wait for them.
const pendingReads = new WeakMap<string[], Set<Promise<void>>>()

/**
 * Everything the page asked the API for that came back a failure: a status of
 * 400 or more, a request that never got an answer, or a 2xx whose JSON body
 * has an `error` in it. Wait for it with `apiSettled` or `expectApiClean`.
 */
export function watchApiFailures(page: Page, isApi: (url: string) => boolean = isApiUrl): string[] {
  const failures: string[] = []
  const pending = new Set<Promise<void>>()
  pendingReads.set(failures, pending)
  page.on('response', (response: Response) => {
    const url = response.url()
    if (!isApi(url)) return
    const method = response.request().method()
    const status = response.status()
    const immediate = describeApiFailure({ status, method, url })
    if (immediate) {
      failures.push(immediate)
      return
    }
    const type = response.headers()['content-type'] ?? ''
    if (status < 200 || status >= 300 || status === 204 || !type.includes('json')) return
    const read = response
      .json()
      .then((body: unknown) => {
        const failure = describeApiFailure({ status, method, url, body })
        if (failure) failures.push(failure)
      })
      // A body the browser already let go of (navigation, a closed page) is
      // not the server's failure.
      .catch(() => undefined)
      .finally(() => pending.delete(read))
    pending.add(read)
  })
  page.on('requestfailed', (request: Request) => {
    const url = request.url()
    if (!isApi(url)) return
    // A cancelled request is the browser tidying up, not the server refusing.
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return
    failures.push(`failed ${request.method()} ${pathOf(url)}`)
  })
  return failures
}

/** Wait until every body `watchApiFailures` started reading has been read. */
export async function apiSettled(failures: string[]): Promise<string[]> {
  const pending = pendingReads.get(failures)
  while (pending && pending.size > 0) {
    await Promise.allSettled([...pending])
  }
  return failures
}

/**
 * The page's API traffic was clean, apart from exactly the refusals named.
 *
 * Expected statuses are matched request by request; nothing is ignored by
 * status alone (stoasystem/stoa-backend#27, 判据).
 */
export async function expectApiClean(
  failures: string[],
  expected: readonly ExpectedApiFailure[] = [],
): Promise<void> {
  await apiSettled(failures)
  const { unexpected, unmet } = reconcileApiFailures(failures, expected)
  expect(unexpected, 'API responses the page could not use').toEqual([])
  expect(unmet, 'refusals the test expected and never saw').toEqual([])
}

/** Uncaught errors, which a page that looks fine can still be full of. */
export function watchPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message.slice(0, 200)))
  return errors
}

export async function signIn(page: Page, role: SmokeRole): Promise<void> {
  const account = smokeAccounts[role]
  await page.goto('/login')
  // By input type, not label: the label is in whichever language the page chose.
  const password = page.locator('input[type=password]').first()
  await page.locator('input[type=email]').first().fill(account.email)
  await password.fill(smokePassword(role))
  await page.locator('button[type=submit]').first().click()
  await expect(page).toHaveURL((url) => url.pathname === account.landing, { timeout: 30_000 })
  // `/` also shows the sign-in form to a visitor; the form has to be gone.
  await expect(password, 'the sign-in form is still on screen').toBeHidden()
}

/**
 * The token the signed-in page's requests carry, read the way the app reads it
 * (`getStoredToken` in src/store/authStore.ts): a tab pinned to an account
 * holds its own in sessionStorage (#34), every other tab the shared one in
 * localStorage. It is never printed or recorded.
 */
export async function pageAccessToken(page: Page): Promise<string> {
  const token = await page.evaluate(
    () => sessionStorage.getItem('stoa_tab_access_token') ?? localStorage.getItem('stoa_access_token'),
  )
  if (!token) throw new Error(`no access token in ${new URL(page.url()).origin}'s storage after signing in`)
  return token
}
