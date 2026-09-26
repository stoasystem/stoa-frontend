import { expect, test, type Request, type Response, type TestInfo } from '@playwright/test'
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

type Profile = { grade: string }

async function studentGrade(api: SmokeApi): Promise<string> {
  const { body } = await api.call<Profile>('GET', '/students/me/profile', { expect: 200 })
  return body.grade
}

test('item 5: a blank grade shows the hint and opens a blank-grade conversation (#50)', {
  tag: ['@item5'],
}, async ({ page }, testInfo) => {
  // No model is asked: the chat sends the opening question as a second
  // request once the conversation exists, and that request is stopped here.
  const failures = watchApiFailures(page)
  const errors = watchPageErrors(page)
  const blockedSends: string[] = []
  await page.route(SEND, async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    blockedSends.push(pathOf(route.request().url()))
    await route.abort('blockedbyclient')
  })
  await signIn(page, 'agent')
  await page.goto('/chat')

  await expect(page.getByText(anyLanguage('chat', 'gradeMissingHint')), 'the blank-grade hint').toBeVisible({
    timeout: 20_000,
  })

  const createRequest = page.waitForRequest(
    (request: Request) => request.method() === 'POST' && isApiUrl(request.url()) && CREATE.test(pathOf(request.url())),
  )
  const createResponse = page.waitForResponse(
    (response: Response) =>
      response.request().method() === 'POST' && isApiUrl(response.url()) && CREATE.test(pathOf(response.url())),
  )
  await page.getByRole('textbox', { name: anyLanguage('chat', 'newConversationLabel') }).fill('[smoke] #50 blank grade')
  await page.getByRole('button', { name: anyLanguage('chat', 'startConversation') }).click()

  const sent = (await createRequest).postDataJSON() as Record<string, unknown>
  const created = await createResponse
  const createdBody = (await created.json()) as { id: string; grade: string }
  await expect.poll(() => blockedSends.length, { message: 'the opening question was sent on its own' }).toBeGreaterThan(0)

  await record(testInfo, 'item5-blank-grade', {
    request: sent,
    status: created.status(),
    conversationId: createdBody.id,
    grade: createdBody.grade,
    blockedSends,
  })
  expect(sent.grade, 'the grade the chat sent').toBe('')
  expect(Object.keys(sent), 'the create request carries no initialMessage').not.toContain('initialMessage')
  expect(created.status(), 'POST /conversations').toBe(201)
  expect(createdBody.grade, 'the grade the conversation was stored with').toBe('')
  expect(errors, 'uncaught page errors').toEqual([])
  await expectApiClean(failures, [
    { method: 'POST', path: SEND, status: 'failed', times: 1, why: 'item 5: the send this test stops' },
    // Until it gives up, the chat asks whether the stopped message was stored.
    { method: 'GET', path: /\/conversations\/[^/]+\/generation$/, status: 404, optional: true, times: 10, why: 'item 5: the stopped message was never stored' },
  ])
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

  test('item 3: the derivative question in the browser, 202 to answer on screen (E01, E13, E19-E21)', {
    tag: ['@item3', '@browser'],
  }, async ({ page, baseURL }, testInfo) => {
    test.setTimeout(ANSWER_WAIT_LIMIT_MS + 90_000)
    const failures = watchApiFailures(page)
    const question = 'Was ist eine Ableitung? Kannst du mir das erklären?'

    // One send, and only after it was counted against the budget.
    let sends = 0
    await page.route(SEND, async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      sends += 1
      if (sends > 1) return route.abort('blockedbyclient')
      return route.continue()
    })

    // Written from the page's events, so kept in an object the checks read.
    const seen = { sentAt: 0, acceptedAt: 0, acceptLanguage: null as string | null }
    type Generation = { commandId?: string | null; status?: string | null; assistantMessageId?: string | null }
    const generations: Array<{ at: number; key: string | null; body: Generation }> = []
    const details = new Map<string, { messages: Array<{ id: string; role: string; content: string }> }>()
    page.on('request', (request) => {
      if (request.method() === 'POST' && SEND.test(pathOf(request.url()))) {
        seen.sentAt = Date.now()
        seen.acceptLanguage = request.headers()['accept-language'] ?? null
      }
    })
    page.on('response', (response) => {
      if (response.request().method() === 'POST' && SEND.test(pathOf(response.url()))) seen.acceptedAt = Date.now()
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
    await page.goto('/chat')
    await page.getByRole('button', { name: anyLanguage('chat', 'subjects.math', { exact: false }) }).first().click()
    await page.getByRole('textbox', { name: anyLanguage('chat', 'newConversationLabel') }).fill(question)

    const created = page.waitForResponse(
      (response) => response.request().method() === 'POST' && isApiUrl(response.url()) && CREATE.test(pathOf(response.url())),
    )
    const accepted = page.waitForResponse(
      (response) => response.request().method() === 'POST' && isApiUrl(response.url()) && SEND.test(pathOf(response.url())),
      { timeout: 60_000 },
    )
    spendGeneration('item3-math-browser')
    await page.getByRole('button', { name: anyLanguage('chat', 'startConversation') }).click()

    const conversation = (await (await created).json()) as { id: string }
    rememberConversations(baseURL!, [conversation.id])
    const send = await accepted
    const acceptBody = (await send.json().catch(() => null)) as {
      conversationId?: string
      commandId?: string
      idempotencyKey?: string
    } | null
    const acceptMs = seen.acceptedAt - seen.sentAt

    const base = {
      conversationId: conversation.id,
      sendStatus: send.status(),
      commandId: acceptBody?.commandId ?? null,
      acceptMs,
      acceptLanguage: seen.acceptLanguage,
    }
    if (send.status() !== 202) await record(testInfo, 'item3-e01-math-browser', base)
    expect(send.status(), 'the send is accepted and answered later (E21)').toBe(202)
    expect(acceptBody?.conversationId, 'the 202 names this conversation').toBe(conversation.id)
    const commandId = acceptBody!.commandId!
    const key = acceptBody!.idempotencyKey!
    expect(commandId, 'the 202 names a command').toBeTruthy()

    // The page's own polling, read as it happens (E13, E19, E20).
    const deadline = seen.acceptedAt + ANSWER_WAIT_LIMIT_MS
    let terminal: (typeof generations)[number] | undefined
    while (!terminal && Date.now() < deadline) {
      await page.waitForTimeout(1000)
      terminal = generations.find((entry) => entry.key === key && ['completed', 'failed'].includes(entry.body.status ?? ''))
    }
    const mine = generations.filter((entry) => entry.key === key)
    const bound = mine.filter((entry) => entry.body.commandId)
    const last = mine.at(-1)
    if (!terminal) {
      const note = timedOutNote({
        kind: 'timed_out',
        commandId,
        lastStatus: last?.body.status ?? null,
        elapsedMs: Date.now() - seen.sentAt,
      })
      await record(testInfo, 'item3-e01-math-browser', { ...base, polls: mine.length, note })
      throw new Error(note)
    }
    const completeMs = terminal.at - seen.sentAt
    expect(bound.map((entry) => entry.body.commandId), 'every poll reports the command the 202 named').toEqual(
      bound.map(() => commandId),
    )
    if (terminal.body.status !== 'completed') {
      await record(testInfo, 'item3-e01-math-browser', { ...base, completeMs, polls: mine.length, terminal: terminal.body })
    }
    expect(terminal.body.status, 'the command ended in a successful terminal state').toBe('completed')
    const assistantId = terminal.body.assistantMessageId!

    // The frontend reads the conversation back and shows the stored answer.
    await expect
      .poll(() => details.get(conversation.id)?.messages.some((message) => message.id === assistantId) ?? false, {
        timeout: 20_000,
        message: 'the page read back the answer the command named',
      })
      .toBe(true)
    const answer = details.get(conversation.id)!.messages.find((message) => message.id === assistantId)!.content
    const snippet = plainSnippet(answer)
    const shown = page.getByRole('article', { name: anyLanguage('chat', 'assistantMessageLabel') }).last()
    if (snippet) {
      await expect(shown, 'the answer is on screen').toContainText(snippet, { timeout: 15_000 })
    } else {
      await expect(shown, 'an answer is on screen').not.toBeEmpty()
    }

    const screen: Screen = {
      language: seen.acceptLanguage === 'en' ? 'en' : 'de',
      topic: /Ableitung|Steigung|Änderung|ändert|Tangente/i,
      wantsExample: true,
    }
    const problems = screenAnswer(answer, screen)
    await record(testInfo, 'item3-e01-math-browser', {
      ...base,
      completeMs,
      polls: mine.length,
      assistantMessageId: assistantId,
      screenProblems: problems,
      answer,
      needsHumanConfirmation: { language: screen.language, explainsRatherThanRefuses: true, exampleOrAnalogy: true },
    })
    if (acceptMs > 1000) {
      testInfo.annotations.push({ type: 'performance', description: `202 after ${acceptMs} ms; target 1 s` })
    }
    expect(sends, 'the page sent the question once').toBe(1)
    expect.soft(seen.acceptLanguage, 'student@ reads the app in German').toBe('de')
    expect.soft(problems, 'keyword screen (a person still reads the answer)').toEqual([])
    await expectApiClean(failures)
  })
})
