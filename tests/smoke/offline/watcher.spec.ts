import { expect, test, type Page } from '@playwright/test'
import { apiSettled, expectApiClean, reconcileApiFailures, watchApiFailures } from '../helpers'

/*
 * The watcher against a page whose every request is answered in the browser:
 * `app.smoke-offline.test` and `api.smoke-offline.test` exist only as routes
 * here, and anything else is aborted before it leaves. No deployment is
 * touched. The first test is the one #44 names: make `watchApiFailures`
 * return an empty array and it turns red.
 */

const APP = 'http://app.smoke-offline.test'
const API = 'http://api.smoke-offline.test'

type Answer = { status: number; body?: unknown }

const ANSWERS: Record<string, Answer> = {
  '/ok': { status: 200, body: { items: [] } },
  '/ok-null-error': { status: 200, body: { items: [], error: null } },
  '/ok-but-error': { status: 200, body: { error: 'quota_store_unavailable' } },
  '/ok-but-error-object': { status: 200, body: { error: { code: 'x' } } },
  '/admin/users': { status: 403, body: { detail: { code: 'forbidden' } } },
  '/students/me/profile': { status: 403, body: { detail: { code: 'forbidden' } } },
  '/auth/me': { status: 401, body: { detail: 'Not authenticated' } },
}

async function offlinePage(page: Page): Promise<void> {
  // Registered first, so it only answers what nothing below does.
  await page.context().route('**/*', (route) => route.abort('blockedbyclient'))
  await page.route(`${APP}/**`, (route) =>
    route.fulfill({
      status: new URL(route.request().url()).pathname === '/broken' ? 500 : 200,
      contentType: 'text/html',
      body: '<!doctype html><title>offline</title><p>offline smoke page</p>',
    }),
  )
  await page.route(`${API}/**`, (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/unreachable') return route.abort('connectionrefused')
    const answer = ANSWERS[path] ?? { status: 404, body: { detail: 'Not Found' } }
    return route.fulfill({
      status: answer.status,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(answer.body ?? null),
    })
  })
  await page.goto(`${APP}/`)
}

async function get(page: Page, url: string): Promise<number | 'failed'> {
  return page.evaluate(async (target) => {
    try {
      return (await fetch(target)).status
    } catch {
      return 'failed' as const
    }
  }, url)
}

test('the negative control: a 404 the API is certain to give is seen', async ({ page }) => {
  const failures = watchApiFailures(page)
  await offlinePage(page)

  expect(await get(page, `${API}/smoke-negative-control/offline`)).toBe(404)
  await apiSettled(failures)

  expect(failures, 'watchApiFailures missed the 404').toContain('404 GET /smoke-negative-control/offline')
  await expectApiClean(failures, [
    { method: 'GET', path: '/smoke-negative-control/offline', status: 404, why: 'the control' },
  ])
})

test('a 200 whose body carries an error is a failure; error: null is not', async ({ page }) => {
  const failures = watchApiFailures(page)
  await offlinePage(page)

  for (const path of ['/ok', '/ok-null-error', '/ok-but-error', '/ok-but-error-object']) {
    expect(await get(page, `${API}${path}`)).toBe(200)
  }
  await apiSettled(failures)

  expect(failures).toEqual([
    '200 GET /ok-but-error error=quota_store_unavailable',
    '200 GET /ok-but-error-object error={"code":"x"}',
  ])
  // Not something a test can declare expected: it is never a refusal.
  expect(
    reconcileApiFailures(failures, [{ method: 'GET', path: /.*/, status: 200, times: 5, why: 'no' }]).unexpected,
  ).toHaveLength(2)
})

test('expected refusals are matched request by request, never by status alone', async ({ page }) => {
  const failures = watchApiFailures(page)
  await offlinePage(page)

  expect(await get(page, `${API}/admin/users`)).toBe(403)
  expect(await get(page, `${API}/students/me/profile`)).toBe(403)
  expect(await get(page, `${API}/auth/me`)).toBe(401)
  await apiSettled(failures)

  const adminOnly = [{ method: 'GET', path: '/admin/users', status: 403, why: 'item 1' }] as const
  // The 403 on the path asked for is consumed; the same status elsewhere is not.
  expect(reconcileApiFailures(failures, adminOnly)).toEqual({
    unexpected: ['403 GET /students/me/profile', '401 GET /auth/me'],
    unmet: [],
  })
  // Asking for a refusal that never came is a failure too.
  expect(
    reconcileApiFailures(['403 GET /admin/users'], [
      ...adminOnly,
      { method: 'POST', path: '/files/x/complete', status: 422, why: 'item 4' },
    ]).unmet,
  ).toEqual(['422 POST /files/x/complete (item 4)'])
  // Each entry is consumed as many times as it says, once by default.
  expect(reconcileApiFailures(['403 GET /admin/users', '403 GET /admin/users'], adminOnly).unexpected).toEqual([
    '403 GET /admin/users',
  ])
  // Optional entries may be absent.
  expect(
    reconcileApiFailures([], [{ method: 'GET', path: /^\/admin\//, status: 403, optional: true, why: 'item 1' }]),
  ).toEqual({ unexpected: [], unmet: [] })

  await expectApiClean(failures, [
    ...adminOnly,
    { method: 'GET', path: '/students/me/profile', status: 403, why: 'offline' },
    { method: 'GET', path: '/auth/me', status: 401, why: 'offline' },
  ])
})

test('a request that never got an answer is a failure; the app\'s own pages are not watched', async ({ page }) => {
  const failures = watchApiFailures(page)
  await offlinePage(page)

  expect(await get(page, `${API}/unreachable`)).toBe('failed')
  expect(await get(page, `${APP}/broken`)).toBe(500)
  await apiSettled(failures)

  expect(failures).toEqual(['failed GET /unreachable'])
})
