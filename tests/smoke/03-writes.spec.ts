import { expect, test, type TestInfo } from '@playwright/test'
import {
  ANSWER_WAIT_LIMIT_MS,
  SmokeApi,
  askViaApi,
  timedOutNote,
  type AskedQuestion,
} from './api'
import { expectApiClean, isApiUrl, pathOf, signIn, watchApiFailures, watchPageErrors } from './helpers'
import { findErrorCode, plainSnippet, screenAnswer, type Screen } from './judge'
import { anyLanguage } from './locales'
import { longObjectHeaderPdf } from './pdf'
import { record, rememberConversations, spendGeneration } from './run'

// Writes, on the test accounts only; nothing is cleaned up (#27, 原则).
// Items 5 and 4 ask no model. Items 2 and 3 are the run's three generation
// requests; `spendGeneration` refuses a sixth. Every AI answer is kept in the
// run record for a person to confirm - the protocol checks and the keyword
// screen below are steps 1 and 2 of #27's three, not the verdict.

const SEND = /\/conversations\/[^/]+\/messages(\/stream)?$/
const CREATE = /^\/conversations$/

/**
 * These patterns are paths, and `page.route` tests a regex against the whole
 * URL: `CREATE` is anchored at `/conversations`, so routing on it directly
 * never matched a request and the handler never ran. Route on the path.
 */
const onApiPath = (pattern: RegExp) => (url: URL) => isApiUrl(url.href) && pattern.test(pathOf(url.href))

type Profile = { grade: string }

async function studentGrade(api: SmokeApi): Promise<string> {
  const { body } = await api.call<Profile>('GET', '/students/me/profile', { expect: 200 })
  return body.grade
}

// Ask (the student's chat since the redesign; `/chat` redirects to it) sends
// the first question with the conversation itself: `POST /conversations` with
// `initialMessage`, answered on the command keyed `initial-<id>`. So the
// screen's create request is the send, and #26's "no initialMessage" now holds
// only for a create made without a question.
const ASK = '/ask'

function isCreate(method: string, url: string): boolean {
  return method === 'POST' && isApiUrl(url) && CREATE.test(pathOf(url))
}

test('item 5: a blank grade opens a blank-grade conversation (#50)', {
  tag: ['@item5'],
}, async ({ page, request, baseURL }, testInfo) => {
  // No model is asked. The screen's create carries the question, so it is read
  // and stopped in the browser; the stored grade is read from a create sent
  // over the API without a question.
  const failures = watchApiFailures(page)
  const errors = watchPageErrors(page)
  const stopped: Array<Record<string, unknown>> = []
  await page.route(onApiPath(CREATE), async (route) => {
    if (!isCreate(route.request().method(), route.request().url())) return route.continue()
    stopped.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.abort('blockedbyclient')
  })
  await signIn(page, 'agent')
  await page.goto(ASK)

  const composer = page.getByRole('textbox', { name: anyLanguage('chat', 'ask.composerLabel') }).last()
  await composer.fill('[smoke] #50 blank grade')
  await composer.press('Enter')
  await expect.poll(() => stopped.length, { message: 'Ask never asked for a conversation' }).toBeGreaterThan(0)

  const api = await SmokeApi.signIn(request, baseURL!, 'agent')
  const created = await api.call<{ id: string; grade: string; messages: unknown[] }>('POST', '/conversations', {
    data: { subject: 'math', grade: '' },
    expect: 201,
  })

  const sent = stopped[0]
  await record(testInfo, 'item5-blank-grade', {
    screenRequest: { ...sent, initialMessage: typeof sent.initialMessage === 'string' ? '(the question)' : sent.initialMessage },
    screenRequestsStopped: stopped.length,
    apiCreate: { status: created.status, conversationId: created.body.id, grade: created.body.grade, messages: created.body.messages.length },
  })
  expect(sent.grade, 'the grade the screen sent').toBe('')
  expect(stopped, 'the screen asked for one conversation').toHaveLength(1)
  expect(created.body.grade, 'the grade the conversation was stored with').toBe('')
  expect(created.body.messages, 'a create without a question holds no message').toEqual([])
  expect(errors, 'uncaught page errors').toEqual([])
  await expectApiClean(failures, [
    { method: 'POST', path: CREATE, status: 'failed', times: 1, why: 'item 5: the create this test stops' },
  ])
})

test('item 5: Ask tells a blank-grade student where to fill in their grade (#50, #154)', {
  tag: ['@item5'],
}, async ({ page }) => {
  // Only the hint and where it leads; nothing is saved, so agent@ stays blank.
  await signIn(page, 'agent')
  await page.goto(ASK)
  const hint = page.getByRole('link', { name: anyLanguage('chat', 'gradeMissingHint') })
  await expect(hint, 'the blank-grade hint').toBeVisible({ timeout: 15_000 })
  await hint.click()
  await expect(page).toHaveURL((url) => url.pathname === '/me' && url.hash === '#me-grade')
  await expect(page.getByRole('textbox', { name: anyLanguage('common', 'me.grade.label') })).toBeFocused()
})

test('item 4: a PDF with a 4 MiB object header is refused as upload_invalid (E08)', {
  tag: ['@item4'],
}, async ({ request, baseURL }, testInfo) => {
  const pdf = longObjectHeaderPdf()
  const api = await SmokeApi.signIn(request, baseURL!, 'student')
  const intent = await api.call<{ uploadId: string; chunkBytes: number; maxBytes: number }>('POST', '/files/intents', {
    data: {
      purpose: 'conversation_attachment',
      filename: 'smoke-e08-long-object-header.pdf',
      contentType: 'application/pdf',
      sizeBytes: pdf.length,
    },
    expect: 200,
  })
  const { uploadId, chunkBytes, maxBytes } = intent.body
  expect(pdf.length, 'the fixture fits the intent').toBeLessThanOrEqual(maxBytes)
  const partCount = Math.max(1, Math.ceil(pdf.length / chunkBytes))
  for (let part = 1; part <= partCount; part += 1) {
    await api.call('PUT', `/files/${uploadId}/chunks/${part}`, {
      data: pdf.subarray((part - 1) * chunkBytes, part * chunkBytes),
      headers: { 'Content-Type': 'application/octet-stream' },
      expect: 200,
      timeout: 60_000,
    })
  }
  const completed = await api.call('POST', `/files/${uploadId}/complete`, {
    data: { partCount },
    expect: 422,
    timeout: 60_000,
  })
  const code = findErrorCode(completed.body)
  await record(testInfo, 'item4-malformed-pdf', {
    uploadId,
    sizeBytes: pdf.length,
    partCount,
    status: completed.status,
    completeMs: completed.ms,
    codePath: code?.path ?? null,
    body: completed.body,
  })
  expect(code?.code, `the refusal's code (at ${code?.path ?? 'no code found'})`).toBe('upload_invalid')
  if (completed.ms > 10_000) {
    testInfo.annotations.push({ type: 'performance', description: `/complete took ${completed.ms} ms; target 10 s` })
  }
})

async function recordAnswer(
  testInfo: TestInfo,
  item: string,
  asked: AskedQuestion,
  screen: Screen,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const problems = asked.answer === null ? [] : screenAnswer(asked.answer, screen)
  await record(testInfo, item, {
    conversationId: asked.conversationId,
    idempotencyKey: asked.idempotencyKey,
    sendStatus: asked.sendStatus,
    acceptMs: asked.acceptMs,
    outcome: asked.outcome,
    note: asked.outcome.kind === 'timed_out' ? timedOutNote(asked.outcome) : null,
    screenProblems: problems,
    answer: asked.answer,
    needsHumanConfirmation: asked.answer === null ? null : {
      language: screen.language,
      explainsRatherThanRefuses: true,
      exampleOrAnalogy: screen.wantsExample === true,
    },
    ...extra,
  })
  if (asked.outcome.kind === 'timed_out') throw new Error(timedOutNote(asked.outcome))
  expect(asked.outcome, 'the command ended in a successful terminal state').toMatchObject({ kind: 'completed' })
  expect.soft(problems, 'keyword screen (a person still reads the answer)').toEqual([])
}

test.describe('answers', { tag: ['@generation'] }, () => {
  test('item 2: Accept-Language q-values choose English over German (E03)', { tag: ['@item2'] }, async ({
    request,
    baseURL,
  }, testInfo) => {
    test.setTimeout(ANSWER_WAIT_LIMIT_MS + 60_000)
    const api = await SmokeApi.signIn(request, baseURL!, 'student')
    // Only numbers in the question, so the header is the one language signal.
    const asked = await askViaApi(api, {
      label: 'item2-e03',
      subject: 'math',
      grade: await studentGrade(api),
      content: '2x + 7 = 19',
      acceptLanguage: 'de;q=0, en;q=1',
    })
    rememberConversations(baseURL!, [asked.conversationId])
    await recordAnswer(testInfo, 'item2-e03-language', asked, { language: 'en', topic: /\b6\b/, minLength: 40 }, {
      acceptLanguage: 'de;q=0, en;q=1',
    })
  })

  test('item 3: a Grade 6 student asks about quantum physics in German (E01)', { tag: ['@item3'] }, async ({
    request,
    baseURL,
  }, testInfo) => {
    test.setTimeout(ANSWER_WAIT_LIMIT_MS + 60_000)
    const api = await SmokeApi.signIn(request, baseURL!, 'student')
    const asked = await askViaApi(api, {
      label: 'item3-physics',
      subject: 'physics',
      grade: await studentGrade(api),
      content: 'Was ist Quantenphysik? Kannst du mir das erklären?',
      acceptLanguage: 'de',
    })
    rememberConversations(baseURL!, [asked.conversationId])
    await recordAnswer(testInfo, 'item3-e01-physics', asked, {
      language: 'de',
      topic: /Quant|Teilchen|Atom|Energie|Licht|Welle|Photon/i,
      wantsExample: true,
    })
  })

  test('item 3: the derivative question in Ask, from the create to the answer on screen (E01, E13, E19-E21)', {
    tag: ['@item3', '@browser'],
  }, async ({ page, baseURL }, testInfo) => {
    test.setTimeout(ANSWER_WAIT_LIMIT_MS + 90_000)
    const failures = watchApiFailures(page)
    const question = 'Was ist eine Ableitung? Kannst du mir das erklären?'

    // One create, which is the send, and only after it was counted against
    // the budget. A second message would be a second generation.
    let creates = 0
    await page.route(onApiPath(CREATE), async (route) => {
      if (!isCreate(route.request().method(), route.request().url())) return route.continue()
      creates += 1
      if (creates > 1) return route.abort('blockedbyclient')
      return route.continue()
    })
    let sends = 0
    await page.route(onApiPath(SEND), async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      sends += 1
      return route.abort('blockedbyclient')
    })

    // Written from the page's events, so kept in an object the checks read.
    const seen = { sentAt: 0, acceptedAt: 0, acceptLanguage: null as string | null, subject: null as string | null }
    type Generation = { commandId?: string | null; status?: string | null; assistantMessageId?: string | null }
    const generations: Array<{ at: number; key: string | null; body: Generation }> = []
    const details = new Map<string, { messages: Array<{ id: string; role: string; content: string }> }>()
    page.on('request', (request) => {
      if (!isCreate(request.method(), request.url())) return
      seen.sentAt = Date.now()
      seen.acceptLanguage = request.headers()['accept-language'] ?? null
      seen.subject = (request.postDataJSON() as { subject?: string }).subject ?? null
    })
    page.on('response', (response) => {
      if (isCreate(response.request().method(), response.url())) seen.acceptedAt = Date.now()
      if (!isApiUrl(response.url()) || response.status() !== 200) return
      const url = new URL(response.url())
      if (/\/generation$/.test(url.pathname)) {
        void response.json().then((body: Generation) => generations.push({
          at: Date.now(),
          key: url.searchParams.get('idempotencyKey'),
          body,
        })).catch(() => undefined)
      } else if (/^\/conversations\/[^/]+$/.test(url.pathname) && response.request().method() === 'GET') {
        void response.json().then((body) => details.set(url.pathname.split('/')[2], body)).catch(() => undefined)
      }
    })

    await signIn(page, 'student')
    await page.goto(ASK)
    const composer = page.getByRole('textbox', { name: anyLanguage('chat', 'ask.composerLabel') }).last()
    await composer.fill(question)

    const created = page.waitForResponse((response) => isCreate(response.request().method(), response.url()), {
      timeout: 60_000,
    })
    spendGeneration('item3-math-browser')
    await composer.press('Enter')

    const createResponse = await created
    const conversation = (await createResponse.json().catch(() => null)) as {
      id?: string
      messages?: Array<{ role: string }>
    } | null
    const acceptMs = seen.acceptedAt - seen.sentAt
    const base = {
      conversationId: conversation?.id ?? null,
      createStatus: createResponse.status(),
      subject: seen.subject,
      acceptMs,
      acceptLanguage: seen.acceptLanguage,
    }
    if (createResponse.status() !== 201) await record(testInfo, 'item3-e01-math-browser', base)
    expect(createResponse.status(), 'POST /conversations with the question').toBe(201)
    const conversationId = conversation!.id!
    rememberConversations(baseURL!, [conversationId])
    // The question is stored and its answer is left to the worker (E21): a
    // create that already carries the answer was answered inside the request.
    expect(conversation?.messages?.map((message) => message.role), 'the create holds the question only').toEqual(['student'])
    const key = `initial-${conversationId}`

    // The page's own polling, read as it happens (E13, E19, E20).
    const deadline = seen.acceptedAt + ANSWER_WAIT_LIMIT_MS
    let terminal: (typeof generations)[number] | undefined
    while (!terminal && Date.now() < deadline) {
      await page.waitForTimeout(1000)
      terminal = generations.find((entry) => entry.key === key && ['completed', 'failed'].includes(entry.body.status ?? ''))
    }
    const mine = generations.filter((entry) => entry.key === key)
    const commandIds = [...new Set(mine.map((entry) => entry.body.commandId).filter(Boolean))]
    const last = mine.at(-1)
    if (!terminal) {
      const note = timedOutNote({
        kind: 'timed_out',
        commandId: commandIds[0] ?? null,
        lastStatus: last?.body.status ?? null,
        elapsedMs: Date.now() - seen.sentAt,
      })
      await record(testInfo, 'item3-e01-math-browser', { ...base, polls: mine.length, note })
      throw new Error(note)
    }
    const completeMs = terminal.at - seen.sentAt
    expect(commandIds, 'every poll reports the one command the question was given').toHaveLength(1)
    const commandId = commandIds[0]
    if (terminal.body.status !== 'completed') {
      await record(testInfo, 'item3-e01-math-browser', { ...base, commandId, completeMs, polls: mine.length, terminal: terminal.body })
    }
    expect(terminal.body.status, 'the command ended in a successful terminal state').toBe('completed')
    const assistantId = terminal.body.assistantMessageId!

    // The frontend reads the conversation back and shows the stored answer.
    await expect
      .poll(() => details.get(conversationId)?.messages.some((message) => message.id === assistantId) ?? false, {
        timeout: 20_000,
        message: 'the page read back the answer the command named',
      })
      .toBe(true)
    const answer = details.get(conversationId)!.messages.find((message) => message.id === assistantId)!.content
    const snippet = plainSnippet(answer)
    const shown = page.locator('[data-message-role=assistant]').last()
    if (snippet) {
      await expect(shown, 'the answer is on screen').toContainText(snippet, { timeout: 15_000 })
    } else {
      await expect(shown, 'an answer is on screen').not.toBeEmpty()
    }

    const screen: Screen = {
      language: seen.acceptLanguage?.toLowerCase().startsWith('en') ? 'en' : 'de',
      topic: /Ableitung|Steigung|Änderung|ändert|Tangente/i,
      wantsExample: true,
    }
    const problems = screenAnswer(answer, screen)
    await record(testInfo, 'item3-e01-math-browser', {
      ...base,
      commandId,
      completeMs,
      polls: mine.length,
      assistantMessageId: assistantId,
      screenProblems: problems,
      answer,
      needsHumanConfirmation: { language: screen.language, explainsRatherThanRefuses: true, exampleOrAnalogy: true },
    })
    if (acceptMs > 1000) {
      testInfo.annotations.push({ type: 'performance', description: `201 after ${acceptMs} ms; target 1 s` })
    }
    expect(creates, 'the page sent the question once').toBe(1)
    expect(sends, 'nothing was sent after the question').toBe(0)
    expect.soft(seen.subject, 'Ask opened the conversation in maths').toBe('math')
    expect.soft(seen.acceptLanguage, 'student@ reads the app in German').toMatch(/^de\b/)
    expect.soft(problems, 'keyword screen (a person still reads the answer)').toEqual([])
    await expectApiClean(failures)
  })
})
