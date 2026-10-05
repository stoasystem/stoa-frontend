import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { ACCESS_TOKEN, StudentWorld } from './support/student'

test('a student signs in, lands on the star map, and stays signed in across a reload', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  await signInAsStudent(page)

  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your question' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('stoa_access_token'))).toBe(ACCESS_TOKEN)

  const sessionReads = backend.callsTo('GET', '/auth/me').length
  await page.reload()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  expect(backend.callsTo('GET', '/auth/me').length, 'the reloaded page restores the session from the backend').toBeGreaterThan(
    sessionReads,
  )
})

test('an answer comes back after a reload in the middle of it, and the question is sent once', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  await signInAsStudent(page)

  // The first question starts a conversation; its answer is read to the end.
  const first = 'Why is a negative times a negative positive?'
  await page.getByRole('textbox', { name: 'Your question' }).fill(first)
  const panel = page.getByRole('complementary', { name: 'Ask' })
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const thread = panel.getByRole('log', { name: 'Messages' })
  await expect(thread.getByText(world.answerFor(first))).toBeVisible()
  const created = backend.callsTo('POST', '/conversations')
  expect(created).toHaveLength(1)
  expect(created[0].body).toMatchObject({ initialMessage: first })
  const conversationId = [...world.conversations.keys()][0]

  // The next one is held while it is written; the page is reloaded meanwhile.
  await page.goto(`/ask/${conversationId}`)
  world.autoFinishAfterReads = null
  const second = 'And a negative times a positive?'
  await panel.getByRole('textbox', { name: 'Your question' }).fill(second)
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  await expect.poll(() => backend.callsTo('POST', '/conversations/{conv_id}/messages/stream').length).toBe(1)
  const key = (backend.callsTo('POST', '/conversations/{conv_id}/messages/stream')[0].body as { idempotencyKey: string })
    .idempotencyKey
  const reads = () =>
    backend.callsTo('GET', '/conversations/{conv_id}/generation').filter((call) => call.query.get('idempotencyKey') === key)
      .length
  await expect.poll(reads).toBeGreaterThan(0)

  await page.reload()
  const readsBeforeReload = reads()
  await expect.poll(reads, { message: 'the reloaded page reads the answer on' }).toBeGreaterThan(readsBeforeReload)
  world.finish(key)

  await expect(thread.getByText(world.answerFor(second))).toBeVisible()
  await expect(thread.getByText(second, { exact: true })).toHaveCount(1)
  expect(backend.callsTo('POST', '/conversations/{conv_id}/messages/stream'), 'sent again after the reload').toHaveLength(1)
})

test('a message that failed retryably is sent again as the same message, and answered once', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  await signInAsStudent(page)

  const first = 'What is a prime number?'
  await page.getByRole('textbox', { name: 'Your question' }).fill(first)
  const panel = page.getByRole('complementary', { name: 'Ask' })
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const thread = panel.getByRole('log', { name: 'Messages' })
  await expect(thread.getByText(world.answerFor(first))).toBeVisible()
  const conversationId = [...world.conversations.keys()][0]

  // The next message fails, and the backend says it may be sent again (#29).
  await page.goto(`/ask/${conversationId}`)
  world.failNextRetryably = true
  const second = 'Is 1 a prime number?'
  await panel.getByRole('textbox', { name: 'Your question' }).fill(second)
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  await expect(thread.getByText('Not sent')).toBeVisible()

  await thread.getByRole('button', { name: 'Send again' }).click()
  await expect(thread.getByText(world.answerFor(second))).toBeVisible()

  const sends = backend.callsTo('POST', '/conversations/{conv_id}/messages/stream')
  expect(sends, 'the first attempt and the retry').toHaveLength(2)
  const keys = sends.map((call) => (call.body as { idempotencyKey: string }).idempotencyKey)
  expect(keys[1], 'the retry names the same message').toBe(keys[0])
  expect([...world.commands.values()].filter((command) => command.question === second)).toHaveLength(1)
  await expect(thread.getByText(second, { exact: true })).toHaveCount(1)
  await expect(thread.getByText(world.answerFor(second))).toHaveCount(1)
})

test('signing out ends the session here and on the backend', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  await signInAsStudent(page)

  await page.getByRole('button', { name: 'Account' }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()

  await expect(page).toHaveURL('/login')
  await expect.poll(() => backend.callsTo('POST', '/auth/logout').length).toBe(1)
  expect(backend.callsTo('POST', '/auth/logout')[0].body).toEqual({ access_token: ACCESS_TOKEN })
  expect(await page.evaluate(() => localStorage.getItem('stoa_access_token'))).toBeNull()

  // Signed out, `/` is the sign-in form again (the address stays `/`).
  await page.goto('/')
  await expect(page.locator('input[type=password]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toHaveCount(0)
})
