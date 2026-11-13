import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/**
 * Ask's first-time tour (#677) is not a modal: the student keeps using Ask
 * while Murmi points at something. On a phone the microphone's bubble stood
 * above the composer, over the end of the thread, and the first answer's
 * "Ask a teacher" came out under it: a tap there reached the bubble, not the
 * button. The thread now keeps room at its end as tall as the bubble, so its
 * newest answer and the button stand clear of it.
 */
test('the tour on the microphone leaves the answer’s "Ask a teacher" free to press (phone, #677)', async ({ page, backend }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const world = new StudentWorld(backend)
  const question = 'Why is the sum of the angles in a triangle 180 degrees?'
  world.sections.set(question, {
    kind: 'answer',
    steps: Array.from({ length: 6 }, (_, index) => `Step ${index + 1}: draw a line through one corner, parallel to the opposite side.`),
    answer: 'The three angles fill a straight line.',
    hints: [],
    similarExercises: [],
    knowledgePoints: [],
    suggestTeacher: true,
  })
  world.install()
  let asked: { conversationId: string } | null = null
  const request = () => ({
    requestId: 'e2e-help-677',
    conversationId: asked!.conversationId,
    status: 'assigned',
    teacherName: 'Test Teacher',
    createdAt: '2026-11-12T08:10:00Z',
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
  await signInAsStudent(page)

  await page.getByRole('textbox', { name: 'Your question' }).fill(question)
  const ask = page.locator('[data-ask-surface]')
  await ask.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const thread = ask.getByRole('log', { name: 'Messages' })
  await expect(thread.getByText('The three angles fill a straight line.', { exact: true })).toBeVisible()

  // The tour is still on the microphone, its bubble over the thread's end.
  const bubble = ask.locator('[data-ask-tour-bubble="mic"]')
  await expect(bubble).toBeVisible()
  const teacher = thread.getByRole('button', { name: 'Ask a teacher' })
  await expect(teacher).toBeVisible()

  // Where an answer puts it, or wherever the student scrolls: at the end of
  // the thread, and brought into view at the thread's lower edge (as a click
  // by an assistive tool or Playwright does), nothing is under the bubble.
  const clear = async () => {
    expect(
      await teacher.evaluate((button) => {
        const box = button.getBoundingClientRect()
        const hit = button.ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
        return hit !== null && button.contains(hit)
      }),
    ).toBe(true)
    const [buttonBox, bubbleBox] = [await teacher.boundingBox(), await bubble.boundingBox()]
    expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(bubbleBox!.y)
  }
  await clear()
  await teacher.evaluate((button) => button.scrollIntoView({ block: 'end' }))
  await clear()
  // The thread's very end, whatever is last in it, stands clear of the bubble too.
  const end = await thread.evaluate((log) => {
    log.scrollTop = log.scrollHeight
    const last = log.lastElementChild!.getBoundingClientRect()
    return last.bottom
  })
  expect(end).toBeLessThanOrEqual((await bubble.boundingBox())!.y)

  // A press asks the teacher (before, it waited out its timeout on the bubble); the tour stays where it was.
  await teacher.click({ timeout: 5_000 })
  await expect(ask.getByRole('region', { name: 'Teacher support' })).toContainText('Test Teacher will join this conversation')
  await expect(bubble).toBeVisible()
})
