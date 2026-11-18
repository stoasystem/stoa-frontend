import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/**
 * Quick replies under Ask's answer (#682, stoa-backend#443): the latest
 * answer's `structured.quickReplies` are buttons under it, above "Ask a
 * teacher"; one pressed goes out as an ordinary follow-up -- its own words as
 * `content`, no quote, a fresh idempotency key -- and the follow-up's answer
 * brings its own replies, or none and no room kept for them. At phone width
 * the longest a reply may be (80 characters) wraps inside its button and
 * nothing scrolls sideways.
 */
const QUESTION = 'How do I add 1/3 and 1/4?'
const LONG = 'Show me the second step again with a drawing, and a bit slower this time?'
const REPLIES = ["I don't get step 2", 'Give me a similar one to try', LONG]
const NEXT = 'One more example, please'

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 375, height: 812 },
]) {
  test(`a quick reply goes out as a follow-up, and the next answer brings its own (${viewport.name}, #682)`, async ({
    page,
    backend,
  }) => {
    expect(LONG.length).toBeLessThanOrEqual(80)
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const world = new StudentWorld(backend)
    world.sections.set(QUESTION, {
      kind: 'answer',
      steps: ['Find a number both 3 and 4 go into: 12.', 'Rewrite both over 12 and add the tops.'],
      answer: '7/12',
      hints: [],
      similarExercises: [],
      knowledgePoints: [],
      suggestTeacher: false,
    })
    world.quickReplies.set(QUESTION, REPLIES)
    world.quickReplies.set(REPLIES[0], [NEXT])
    world.quickReplies.set(NEXT, [])
    world.install()
    await signInAsStudent(page)

    await page.getByRole('textbox', { name: 'Your question' }).fill(QUESTION)
    const ask = page.locator('[data-ask-surface]')
    await ask.getByRole('textbox', { name: 'Your question' }).press('Enter')
    const thread = ask.getByRole('log', { name: 'Messages' })
    await expect(thread.getByText('7/12', { exact: true })).toBeVisible()

    const group = thread.getByRole('group', { name: 'What you could say next' })
    await expect(group.getByRole('button')).toHaveText(REPLIES)
    // Above "Ask a teacher", under the answer.
    const repliesBox = (await group.boundingBox())!
    const teacherBox = (await thread.getByRole('button', { name: 'Ask a teacher' }).boundingBox())!
    expect(repliesBox.y + repliesBox.height).toBeLessThanOrEqual(teacherBox.y)
    // Wrapped, not cut off or run off the side.
    const thread0 = (await thread.boundingBox())!
    for (const reply of REPLIES) {
      const box = (await group.getByRole('button', { name: reply }).boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(thread0.x)
      expect(box.x + box.width).toBeLessThanOrEqual(thread0.x + thread0.width + 0.5)
    }
    const sideways = await page.evaluate(`(() => {
      const log = document.querySelector('[data-ask-surface] [role="log"]')
      return { page: document.documentElement.scrollWidth - window.innerWidth, thread: log.scrollWidth - log.clientWidth }
    })()`)
    expect(sideways).toEqual({ page: 0, thread: 0 })
    const shots = process.env.STOA_682_SHOTS
    if (shots) await page.screenshot({ path: `${shots}/${viewport.name}.png` })

    await group.getByRole('button', { name: REPLIES[0] }).click()
    await expect(thread.getByText(`Here is how to think about it: ${REPLIES[0]}`)).toBeVisible()
    const sent = backend.callsTo('POST', '/conversations/{conv_id}/messages/stream')
    expect(sent).toHaveLength(1)
    const body = sent[0].body as Record<string, unknown>
    expect(body.content).toBe(REPLIES[0])
    expect(body).not.toHaveProperty('quote')
    expect(body.idempotencyKey).toEqual(expect.any(String))
    expect(body.idempotencyKey).not.toMatch(/^initial-/)

    // Only the new answer's own reply, under it; none under the first answer.
    await expect(thread.getByRole('group', { name: 'What you could say next' })).toHaveCount(1)
    await expect(thread.getByRole('group', { name: 'What you could say next' }).getByRole('button')).toHaveText([NEXT])

    await thread.getByRole('button', { name: NEXT }).click()
    await expect(thread.getByText(`Here is how to think about it: ${NEXT}`)).toBeVisible()
    await expect(thread.locator('[data-ask-quick-replies]')).toHaveCount(0)
    expect(backend.callsTo('POST', '/conversations/{conv_id}/messages/stream')).toHaveLength(2)
  })
}
