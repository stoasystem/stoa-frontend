import { expect, test } from './support/fixtures'
import { BOARD_ORIGIN } from './support/origins'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/**
 * The virtual classroom (#696), on the built app under the production content
 * security policy. Since help requests carry their mode (#705), asking keeps
 * the student in the conversation: a classroom request waits there for a
 * teacher to accept it, and only then does the card offer the way in. With a
 * seat to be had (stoa-backend#467) that leads into
 * `/classroom/:conversationId`. The board is framed from its own host
 * (`frame-src`), the bar says the teacher has joined, and leaving goes back to
 * the conversation.
 *
 * The classroom request here is the backend's, as the student chose it.
 * Choosing it (locked outside the online classroom option), the word about the
 * microphone before entering, and a text request never showing a classroom,
 * are helpModes705.test.tsx and classroom696.test.tsx. Here the browser has
 * allowed the microphone before, so the card leads straight in.
 *
 * Daily is not reachable here: its call bundle is refused (from *.daily.co and
 * its fallback hosts), and the voice says it did not connect while the board
 * and the conversation go on. Daily then reports the failure to its own
 * Sentry, which the policy refuses on purpose: that one refusal is expected
 * and taken off the problems; anything else fails the test.
 */
const DAILY_SENTRY = /^CSP: .*https:\/\/[a-z0-9]+\.ingest\.sentry\.io\//
test('a classroom request a teacher accepted leads from the conversation into the classroom, its board framed (#696, #705)', async ({
  page,
  backend,
}) => {
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
  // A teacher is online: with none, the waiting card says so instead.
  backend.on('GET', '/teacher-help/availability', () => ({ status: 200, body: { online: true, availableTeachers: 1 } }))

  // The conversation's request, once there is one: a classroom request, as the backend keeps it.
  let help: { conversationId: string; status: 'pending' | 'in_progress' } | null = null
  backend.on('GET', '/teacher-help/conversations/{conv_id}/request', () =>
    help
      ? {
          status: 200,
          body: {
            requestId: 'e2e-help-1',
            conversationId: help.conversationId,
            status: help.status,
            mode: 'classroom',
            teacherName: 'Frau Muster',
            createdAt: '2026-11-16T08:10:00Z',
          },
        }
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

  // Allowed before: no word about the microphone in the way (#705).
  await page.context().grantPermissions(['microphone'])
  await signInAsStudent(page)
  await page.getByRole('textbox', { name: 'Your question' }).fill(question)
  const ask = page.locator('[data-ask-surface]')
  await ask.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const thread = ask.getByRole('log', { name: 'Messages' })
  await expect(thread.getByText('x = 5', { exact: true })).toBeVisible()
  const [conversationId] = world.conversations.keys()

  // Asked for the classroom, not yet accepted: the student waits in the conversation, with no way in.
  help = { conversationId, status: 'pending' }
  await page.goto(`/ask/${conversationId}`)
  const card = page.getByRole('region', { name: 'Teacher support' })
  await expect(card).toHaveAttribute('data-help-mode', 'classroom')
  await expect(card).toContainText('Once a teacher accepts your request, you can enter it here.')
  await expect(card.getByRole('button', { name: 'Enter classroom' })).toHaveCount(0)
  expect(seats).toBe(0)

  // A teacher accepted it: now the card leads in.
  help = { conversationId, status: 'in_progress' }
  await page.reload()
  await expect(card).toContainText('Your teacher is waiting for you in the classroom.')
  await card.getByRole('button', { name: 'Enter classroom' }).click()
  await expect(page).toHaveURL(`/classroom/${conversationId}`)

  await expect(page.locator('[data-classroom-status]')).toHaveText('Frau Muster has joined')
  const frame = page.locator('iframe[title="Whiteboard"]')
  await expect(frame).toHaveAttribute('src', board)
  await expect(page.frameLocator('iframe[title="Whiteboard"]').getByText('board')).toBeVisible()
  await expect(page.locator('[data-whiteboard="loaded"]')).toBeVisible()
  // The conversation goes on beside the board.
  await expect(page.locator('[data-classroom-sidebar]').getByText('x = 5', { exact: true })).toBeVisible()
  await expect(page.locator('[data-classroom-voice="failed"]')).toBeVisible({ timeout: 15_000 })
  // The seat is asked for once, on the way in.
  expect(seats).toBe(1)

  await page.getByRole('link', { name: 'Leave classroom' }).click()
  await expect(page).toHaveURL(`/ask/${conversationId}`)

  // Daily's own error report, refused by the policy as it should be.
  for (let at = backend.problems.length - 1; at >= 0; at -= 1) {
    if (DAILY_SENTRY.test(backend.problems[at])) backend.problems.splice(at, 1)
  }
})
