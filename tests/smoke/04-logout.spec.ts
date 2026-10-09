import { expect, test, type Request, type Response } from '@playwright/test'
import { SmokeApi, apiOrigin, servedRelease } from './api'
import { expectApiClean, isApiUrl, pageAccessToken, pathOf, signIn, watchApiFailures } from './helpers'
import { anyLanguage } from './locales'
import { record } from './run'

// Last in the run, and parent@'s last step: logging out revokes every session
// the account has, including one a person has open elsewhere (#27, 原则).
// This is #49's acceptance reading: after the screen's logout, the token the
// page held answers 401.

test('item 8: logging out revokes the token the page held (#49, #5)', { tag: ['@item8'] }, async ({
  page,
  request,
  baseURL,
}, testInfo) => {
  // #49's fix has to be live, or this only measures the old logout.
  const expected = process.env.STOA_SMOKE_EXPECT_RELEASE_ID
  test.skip(!expected, 'STOA_SMOKE_EXPECT_RELEASE_ID not set: #49 (frontend 5899088 or later) is not confirmed live')
  const served = await servedRelease(request, baseURL!)
  expect(served.release.releaseId, 'the release confirmed against the deploy run').toMatch(
    new RegExp(`^${expected!.toLowerCase()}`),
  )

  const failures = watchApiFailures(page)
  await signIn(page, 'parent')
  const token = await pageAccessToken(page)
  const api = SmokeApi.withToken(request, await apiOrigin(request, baseURL!), token)
  const before = await api.call('GET', '/auth/me', { expect: 200 })

  const logoutRequest = page.waitForRequest(
    (request: Request) => request.method() === 'POST' && isApiUrl(request.url()) && pathOf(request.url()) === '/auth/logout',
  )
  const logoutResponse = page.waitForResponse(
    (response: Response) =>
      response.request().method() === 'POST' && isApiUrl(response.url()) && pathOf(response.url()) === '/auth/logout',
  )
  // Logging out is the last entry of the account menu in the top bar.
  await page.getByRole('button', { name: anyLanguage('common', 'accountMenu.open') }).filter({ visible: true }).first().click()
  await page.getByRole('menuitem', { name: anyLanguage('common', 'actions.logOut') }).click()
  const sent = (await logoutRequest).postDataJSON() as { access_token?: string }
  const answered = await logoutResponse
  await expect(page).toHaveURL(/\/login/)

  const after = await api.call('GET', '/auth/me', { expect: 401 })
  await record(testInfo, 'item8-logout', {
    releaseId: served.release.releaseId,
    beforeStatus: before.status,
    logoutStatus: answered.status(),
    logoutCarriedThePageToken: sent.access_token === token,
    afterStatus: after.status,
  })
  expect(sent.access_token === token, 'the screen sent the token it held to /auth/logout').toBe(true)
  expect(answered.status(), 'POST /auth/logout').toBe(204)
  await expectApiClean(failures)
})
