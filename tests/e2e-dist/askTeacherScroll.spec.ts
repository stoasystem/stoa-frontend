import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/**
 * Asking a teacher from Ask beside the star map moved the whole page up by
 * about 280px, and the request's card with it, out of sight (#636).
 *
 * The answer's steps carry words for screen readers only ("Step N:",
 * "(Step N)"), placed absolutely. With the thread not positioned they were
 * held by the panel around it, at their place in the unscrolled thread, and
 * made the star map's shell -- `overflow: hidden`, never meant to scroll --
 * taller than the screen. Anything then brought into view in the thread (a
 * click by an assistive tool, a screen reader's cursor, find in page)
 * scrolled the shell, and the whole page with it.
 */
for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 375, height: 812 },
]) {
  test(`asking a teacher leaves the page where it was, and the card in sight (${viewport.name}, #636)`, async ({
    page,
    backend,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const world = new StudentWorld(backend)
    const question = 'How do I solve 3x + 5 = 20, and why does it work?'
    world.sections.set(question, {
      kind: 'answer',
      steps: Array.from(
        { length: 10 },
        (_, index) =>
          `Step ${index + 1}: do the same thing to both sides of the equation, so that it stays balanced while x is left alone.`,
      ),
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
      status: 'assigned',
      teacherName: 'Test Teacher',
      createdAt: '2026-09-29T08:10:00Z',
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
    await expect(thread.getByText('x = 5', { exact: true })).toBeVisible()

    await thread.getByRole('button', { name: 'Ask a teacher' }).click()
    const card = ask.getByRole('region', { name: 'Teacher support' })
    await expect(card).toContainText('Test Teacher will join this conversation')
    // What an assistive tool does to reach the first step: bring it into view.
    await thread.getByRole('button', { name: "I don't get this step (Step 1)" }).evaluate((node) => node.scrollIntoView())
    const shots = process.env.STOA_636_SHOTS
    if (shots) await page.screenshot({ path: `${shots}/${viewport.name}.png` })

    // Only the thread scrolled: neither Ask's surface nor anything around it moved, and they have nothing to scroll.
    const around = await page.evaluate(`(() => {
      const surface = document.querySelector('[data-ask-surface]')
      const host = document.querySelector('[data-ask-host]')
      const moved = []
      for (let at = surface; at; at = at.parentElement) {
        if (at.scrollTop !== 0) moved.push(at.tagName + '.' + at.className + ': ' + at.scrollTop)
      }
      if (window.scrollY !== 0) moved.push('window: ' + window.scrollY)
      return { moved, overflow: [host.scrollHeight - host.clientHeight, surface.scrollHeight - surface.clientHeight] }
    })()`)
    expect(around).toEqual({ moved: [], overflow: [0, 0] })

    // And the card is on the screen.
    const box = await card.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
  })
}
