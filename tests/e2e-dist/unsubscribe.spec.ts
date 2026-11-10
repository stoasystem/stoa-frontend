import type { BackendRequest } from './support/backend'
import { expect, test } from './support/fixtures'

/**
 * The link at the foot of a notification email (#621; stoa-backend#363),
 * through the built app at a phone's width: no sign-in, the token from the
 * link sent as the query and nothing else, an undo, and one message for any
 * refused link. The mock answers are checked against the backend's OpenAPI.
 */

const TOKEN = 'eyJjIjoid2Vla2x5X3JlcG9ydCIsImsiOiJrMSIsInUiOiJwLTEifQ.c2lnbmF0dXJl'

test.use({ viewport: { width: 375, height: 740 }, locale: 'en-GB' })

test('a weekly report link unsubscribes, and the page undoes it, with no session and no sideways scroll', async ({
  page,
  backend,
}) => {
  const seen: Array<{ path: string; token: string | null; authorization: string | undefined }> = []
  const answer = (subscribed: boolean) => ({ query, headers }: BackendRequest) => {
    seen.push({ path: subscribed ? 'resubscribe' : 'unsubscribe', token: query.get('token'), authorization: headers.authorization })
    return { status: 200, body: { kind: 'weekly_report', subscribed } }
  }
  backend.on('POST', '/notifications/email-unsubscribe', answer(false))
  backend.on('POST', '/notifications/email-resubscribe', answer(true))

  await page.goto(`/unsubscribe?token=${encodeURIComponent(TOKEN)}`)

  await expect(page.getByRole('heading', { level: 1, name: 'Email notifications' })).toBeVisible()
  await expect(page.getByText('The weekly report will no longer be sent by email.', { exact: false })).toBeVisible()
  const wide = await page.evaluate<number>("document.documentElement.scrollWidth - document.documentElement.clientWidth")
  expect(wide, 'sideways scroll at 375px').toBeLessThanOrEqual(0)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('Subscribed again')).toBeVisible()

  expect(seen).toEqual([
    { path: 'unsubscribe', token: TOKEN, authorization: undefined },
    { path: 'resubscribe', token: TOKEN, authorization: undefined },
  ])
})

test('a refused link reads as one invalid link, with nothing to press', async ({ page, backend }) => {
  backend.on('POST', '/notifications/email-unsubscribe', () => ({
    status: 400,
    body: { detail: { code: 'email_unsubscribe_link_invalid', message: 'This link is not valid.', correlationId: 'e2e-correlation' } },
  }))

  await page.goto(`/unsubscribe?token=${TOKEN}x`)

  await expect(page.getByRole('alert')).toHaveText(/This link is not valid\./)
  await expect(page.getByRole('region', { name: 'Email notifications' }).getByRole('button')).toHaveCount(0)
})
