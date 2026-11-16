import { expect, test } from './support/fixtures'
import { BOARD_ORIGIN } from './support/origins'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/**
 * The virtual classroom (#696), on the built app under the production content
 * security policy: a student who asks a teacher, and is given a seat
 * (stoa-backend#467), goes into `/classroom/:conversationId`. The board is
 * framed from its own host (`frame-src`), the bar says a teacher is being
 * found, and leaving goes back to the conversation.
 *
 * Without a seat (503 `classroom_unavailable`, the world's default) the
 * student stays in Ask: askTeacherScroll.spec.ts.
 *
 * Daily is not reachable here: its call bundle is refused (from *.daily.co and
 * its fallback hosts), and the voice says it did not connect while the board
 * and the conversation go on. Daily then reports the failure to its own
 * Sentry, which the policy refuses on purpose: that one refusal is expected
 * and taken off the problems; anything else fails the test.
 */
const DAILY_SENTRY = /^CSP: .*https:\/\/[a-z0-9]+\.ingest\.sentry\.io\//
test('asking a teacher with a seat to be had leads into the classroom, its board framed (#696)', async ({ page, backend }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  const world = new StudentWorld(backend)
  const question = 'How do I solve 3x + 5 = 20?'
  world.sections.set(question, {
    kind: 'answer',
    steps: ['Take 5 from both sides: 3x = 15.', 'Divide both sides by 3: x = 5.'],
    answer: 'x = 5',
    hints: [],
    similarExercises: [],
    knowledgePoints: [],
    suggestTeacher: true,
  })
  world.install()

  let asked: { conversationId: string } | null = null
  const request = () => ({
    requestId: 'e2e-help-1',
    conversationId: asked!.conversationId,
    status: 'pending',
    createdAt: '2026-11-16T08:10:00Z',
  })
  backend.on('POST', '/teacher-help/request', ({ body }) => {
    asked = body as { conversationId: string }
    return { status: 200, body: request() }
  })
  backend.on('GET', '/teacher-help/conversations/{conv_id}/request', () =>
    asked
      ? { status: 200, body: request() }
      : { status: 404, body: { detail: 'This conversation was never escalated to a teacher' } },
  )
  const board = `${BOARD_ORIGIN}/boards/help-e2e?token=e2e-board-token`
  let seats = 0
  backend.on('POST', '/conversations/{conv_id}/classroom', () => {
    seats += 1
    return {
      status: 200,
      body: {
        whiteboardUrl: board,
        voice: { roomUrl: 'https://stoa-e2e.daily.co/stoa-help-e2e', token: 'e2e-meeting-token' },
        expiresAt: '2099-01-01T00:00:00Z',
      },
    }
  })
  // The board's host answers with a page; Daily is out of reach.
  await page.route(`${BOARD_ORIGIN}/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>board</title><p>board</p>' }),
  )
  for (const host of ['https://*.daily.co/**', 'https://*.dailywebrtc.com/**', 'https://*.dailywebrtc.net/**']) {
    await page.route(host, (route) => route.abort('connectionrefused'))
  }

  await signInAsStudent(page)
  await page.getByRole('textbox', { name: 'Your question' }).fill(question)
  const ask = page.locator('[data-ask-surface]')
  await ask.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const thread = ask.getByRole('log', { name: 'Messages' })
  await expect(thread.getByText('x = 5', { exact: true })).toBeVisible()

  await thread.getByRole('button', { name: 'Ask a teacher' }).click()
  await expect(page).toHaveURL(/\/classroom\/[^/?]+$/)
  const conversationId = asked!.conversationId
  expect(page.url()).toContain(`/classroom/${conversationId}`)

  await expect(page.locator('[data-classroom-status]')).toHaveText('Finding a teacher for you…')
  const frame = page.locator('iframe[title="Whiteboard"]')
  await expect(frame).toHaveAttribute('src', board)
  await expect(page.frameLocator('iframe[title="Whiteboard"]').getByText('board')).toBeVisible()
  await expect(page.locator('[data-whiteboard="loaded"]')).toBeVisible()
  // The conversation goes on beside the board.
  await expect(page.locator('[data-classroom-sidebar]').getByText('x = 5', { exact: true })).toBeVisible()
  await expect(page.locator('[data-classroom-voice="failed"]')).toBeVisible({ timeout: 15_000 })
  // The seat asked for before going in is the page's: not asked for again.
  expect(seats).toBe(1)

  await page.getByRole('link', { name: 'Leave classroom' }).click()
  await expect(page).toHaveURL(`/ask/${conversationId}`)

  // Daily's own error report, refused by the policy as it should be.
  for (let at = backend.problems.length - 1; at >= 0; at -= 1) {
    if (DAILY_SENTRY.test(backend.problems[at])) backend.problems.splice(at, 1)
  }
})
