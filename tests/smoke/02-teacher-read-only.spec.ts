import { expect, test, type Page } from '@playwright/test'
import { SmokeApi } from './api'
import { expectApiClean, signIn, watchApiFailures, watchPageErrors } from './helpers'
import { anyLanguage } from './locales'
import { deploymentState, record } from './run'

// The teacher side of what went live on 2026-11-20, read only (items 11-14).
// Nothing here writes a row a person would see. Two things to know:
//
// * Every read of `GET /teachers/me/help-requests` is teacher@'s heartbeat
//   (backend #472): for five minutes afterwards teacher@ counts as online, and
//   if its own status is "available" a real student's request can be offered
//   to it. The role sign-in in 02-read-only.spec.ts already does the same.
//   So teacher@ is normally paused (decided 2026-11-20); item 11 flags it
//   when it is found available, and 03-teacher-writes.spec.ts item 11 leaves
//   it paused.
// * `POST .../assignment-automation/batches/preview` is a POST that writes
//   nothing (`preview_assignment_automation_batch`: the batch id is a hash,
//   no row is stored), so item 12 reads it here.
//
// The items that write -- a help request, an assignment, an exercise draft --
// and the one that asks a model are in 03-teacher-writes.spec.ts.

type HelpMode = 'text' | 'classroom'
const HELP_MODES: readonly HelpMode[] = ['text', 'classroom']

type ModeStanding = {
  canRequest: boolean
  blockedReason?: string | null
  remainingCases: number
  weeklyCases: number
  resetsAt?: string | null
}

type TeacherAvailability = {
  online: boolean
  availableTeachers: number
  teacherSupport: (ModeStanding & { text: ModeStanding; classroom: ModeStanding }) | null
}

type HelpSummary = {
  requestId: string
  conversationId: string
  studentId: string
  subject: string
  status: string
  mode?: string
  createdAt: string
}

const BLOCKED_REASONS = ['teacher_support_allowance_exhausted', 'teacher_support_not_included']

/** One way's standing, as `TeacherSupportModeStanding` declares it (backend #482). */
function checkStanding(standing: ModeStanding | undefined, where: string): void {
  expect(standing, `${where} is in the answer`).toBeTruthy()
  expect(typeof standing!.canRequest, `${where}.canRequest`).toBe('boolean')
  expect(Number.isInteger(standing!.remainingCases), `${where}.remainingCases`).toBe(true)
  expect(Number.isInteger(standing!.weeklyCases), `${where}.weeklyCases`).toBe(true)
  expect(standing!.remainingCases, `${where}: no more left than the week has`).toBeLessThanOrEqual(standing!.weeklyCases)
  if (standing!.canRequest) {
    expect(standing!.blockedReason ?? null, `${where}: allowed, so no reason`).toBeNull()
  } else {
    expect(BLOCKED_REASONS, `${where}.blockedReason`).toContain(standing!.blockedReason)
  }
}

/** Where each of the two students stands for each way of asking, this Zurich week. */
async function readStanding(api: SmokeApi, who: string) {
  const { body } = await api.call<TeacherAvailability>('GET', '/teacher-help/availability', { expect: 200 })
  const support = body.teacherSupport
  expect(support, `${who}: teacherSupport (null means the week could not be read)`).not.toBeNull()
  checkStanding(support!.text, `${who} text`)
  checkStanding(support!.classroom, `${who} classroom`)
  // The top-level fields are the text one, as before there were two ways.
  expect(support!.remainingCases, `${who}: top level is the text standing`).toBe(support!.text.remainingCases)
  const brief = (standing: ModeStanding) => ({
    canRequest: standing.canRequest,
    blockedReason: standing.blockedReason ?? null,
    remaining: standing.remainingCases,
    weekly: standing.weeklyCases,
  })
  return {
    online: body.online,
    availableTeachers: body.availableTeachers,
    text: brief(support!.text),
    classroom: brief(support!.classroom),
  }
}

async function userId(api: SmokeApi): Promise<string> {
  const { body } = await api.call<{ id: string }>('GET', '/auth/me', { expect: 200 })
  expect(body.id, 'GET /auth/me names the account').toBeTruthy()
  return body.id
}

async function helpRequests(api: SmokeApi): Promise<HelpSummary[]> {
  const { body } = await api.call<{ items: HelpSummary[] }>('GET', '/teachers/me/help-requests', { expect: 200 })
  return body.items
}

/** A teacher page comes up: something in main, no uncaught error, no failed API read. */
async function expectTeacherPage(page: Page, path: string, failures: string[], errors: string[]) {
  await page.goto(path)
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await page.waitForTimeout(2000)
  expect(new URL(page.url()).pathname, `${path} kept the teacher there`).toBe(path)
  const main = page.getByRole('main')
  await expect(main, `${path}: main is visible`).toBeVisible()
  await expect(main, `${path}: main has content`).toContainText(/\S/)
  expect(errors, `${path}: uncaught page errors`).toEqual([])
  await expectApiClean(failures)
}

test('item 11: each way of asking a teacher is stood for and shown (#719, backend #499 #482)', {
  tag: ['@item11', '@readonly'],
}, async ({ page, request, baseURL }, testInfo) => {
  // The student side: both ways have a standing for both test students.
  const student = await readStanding(await SmokeApi.signIn(request, baseURL!, 'student'), 'student@')
  const agent = await readStanding(await SmokeApi.signIn(request, baseURL!, 'agent'), 'agent@')

  // The teacher side: every request in the queue says how it was asked, and
  // names its student (backend #495).
  const teacher = await SmokeApi.signIn(request, baseURL!, 'teacher')
  const own = await teacher.call<{ status?: string | null; subjects?: string[] }>(
    'GET',
    '/teachers/me/availability',
    { expect: 200 },
  )
  const items = await helpRequests(teacher)
  for (const item of items) {
    expect(HELP_MODES, `request ${item.requestId}: mode`).toContain(item.mode)
    expect(item.studentId, `request ${item.requestId}: studentId`).toBeTruthy()
  }
  const newest = items[0] ?? null
  let detail: { mode?: string; status?: string } | null = null
  if (newest) {
    detail = (await teacher.call<{ mode?: string; status?: string }>(
      'GET',
      `/teachers/me/help-requests/${newest.requestId}`,
      { expect: 200 },
    )).body
    expect(detail.mode, 'the detail says the same way as the queue').toBe(newest.mode)
  }

  // Not a failure, since a person may have switched it on to try the teacher
  // side by hand, but worth seeing: while available and online it can be
  // offered a real student's request nobody is watching for.
  const exposed = own.body.status === 'available'
  if (exposed) {
    testInfo.annotations.push({
      type: 'warning',
      description: 'teacher@ is available: set it to paused, or a maths request from a real student can be offered to it',
    })
  }

  await record(testInfo, 'item11-help-modes', {
    student,
    agent,
    teacher: {
      availabilityStatus: own.body.status ?? null,
      subjects: own.body.subjects ?? null,
      requests: items.length,
      byStatusAndMode: items.reduce<Record<string, number>>((counts, item) => {
        const key = `${item.status}/${item.mode}`
        counts[key] = (counts[key] ?? 0) + 1
        return counts
      }, {}),
      newest: newest && { requestId: newest.requestId, status: newest.status, mode: newest.mode, subject: newest.subject },
    },
    note: exposed
      ? 'teacher@ 是可接单状态：应改成暂停，否则接下来 5 分钟可能被派到真实学生的求助 (#472)'
      : 'teacher@ 读了求助列表，接下来 5 分钟算在线 (#472)；状态不是可接单，不会被派单',
  })

  // The screens: the queue, and the newest request's page when there is one.
  const failures = watchApiFailures(page)
  const errors = watchPageErrors(page)
  await signIn(page, 'teacher')
  await expectTeacherPage(page, '/teacher', failures, errors)
  if (!newest) {
    testInfo.annotations.push({ type: 'coverage', description: 'teacher@ 没有求助，详情页未读' })
    return
  }
  await expectTeacherPage(page, `/teacher/requests/${newest.requestId}`, failures, errors)
})

test('item 12: a teacher recommends practice only to a student they helped (#720, backend #495)', {
  tag: ['@item12', '@readonly'],
}, async ({ page, request, baseURL }, testInfo) => {
  const teacher = await SmokeApi.signIn(request, baseURL!, 'teacher')
  const items = await helpRequests(teacher)
  const agentId = await userId(await SmokeApi.signIn(request, baseURL!, 'agent'))

  // The only relation that opens a student (CONTEXT.md, 布置练习的权限): a
  // request the teacher holds in progress, or resolved in the last 14 days.
  // The queue does not say when a request was resolved, so a resolved one may
  // be past its window, and only one in progress has to answer 200.
  const held = items.find((item) => item.status === 'in_progress') ?? null
  const resolved = items.find((item) => item.status === 'resolved') ?? null
  const related = held ?? resolved
  const policy = { autonomyLevel: 'teacher_approved_batch', deliveryMode: 'assigned' }

  let relatedRead: Record<string, unknown> | null = null
  if (related) {
    const expectStatus = related === held ? 200 : [200, 404]
    const assignments = await teacher.call<{ items?: unknown[] }>(
      'GET',
      `/adaptive/students/${related.studentId}/assignments?includeArchived=true`,
      { expect: expectStatus },
    )
    const preview = await teacher.call<{
      selected?: Array<{ rationaleCode?: string | null }>
      refused?: Array<{ refusalCode?: string | null }>
    }>('POST', `/adaptive/students/${related.studentId}/assignment-automation/batches/preview`, {
      data: { policy },
      expect: expectStatus,
    })
    if (preview.status === 200) {
      // Codes, so the page can say them in the teacher's language (#495).
      for (const candidate of preview.body.selected ?? []) {
        expect(candidate.rationaleCode, 'a proposed exercise says why, as a code').toBeTruthy()
      }
      for (const candidate of preview.body.refused ?? []) {
        expect(candidate.refusalCode, 'a refused exercise says why, as a code').toBeTruthy()
      }
    }
    relatedRead = {
      requestId: related.requestId,
      requestStatus: related.status,
      subject: related.subject,
      assignmentsStatus: assignments.status,
      assignments: assignments.body.items?.length ?? null,
      previewStatus: preview.status,
      selected: preview.body.selected?.length ?? null,
      refused: preview.body.refused?.length ?? null,
      refusalCodes: (preview.body.refused ?? []).reduce<Record<string, number>>((counts, candidate) => {
        const code = candidate.refusalCode ?? 'none'
        counts[code] = (counts[code] ?? 0) + 1
        return counts
      }, {}),
    }
  } else {
    testInfo.annotations.push({ type: 'coverage', description: 'teacher@ 没有处理中或已解决的求助：有关系的一侧未读' })
  }

  // A student the teacher never helped reads as one that does not exist.
  const agentRelated = items.some((item) => item.studentId === agentId && ['in_progress', 'resolved'].includes(item.status))
  let unrelated: Record<string, unknown> | null = null
  if (agentRelated) {
    testInfo.annotations.push({ type: 'coverage', description: 'teacher@ 接过 agent@ 的求助：无关学生的 404 未读' })
  } else {
    const assignments = await teacher.call('GET', `/adaptive/students/${agentId}/assignments`, { expect: 404 })
    const preview = await teacher.call('POST', `/adaptive/students/${agentId}/assignment-automation/batches/preview`, {
      data: { policy },
      expect: 404,
    })
    unrelated = { assignmentsStatus: assignments.status, previewStatus: preview.status }
  }
  await record(testInfo, 'item12-assign-practice-reads', { related: relatedRead, unrelated })

  // The page the teacher assigns from, opened on that student when there is one.
  const failures = watchApiFailures(page)
  const errors = watchPageErrors(page)
  await signIn(page, 'teacher')
  await expectTeacherPage(page, '/teacher/learning-automation', failures, errors)
})

test('item 13: the retired exercise-draft route stays gone (backend #518)', {
  tag: ['@item13', '@readonly'],
}, async ({ request, baseURL }, testInfo) => {
  // backend #518 retired the exercise-draft routes; this used to read them (#519 #535).
  const teacher = await SmokeApi.signIn(request, baseURL!, 'teacher')
  const { status } = await teacher.call('GET', '/teachers/ai-tools/drafts?draft_type=practice_exercise', { expect: 404 })
  await record(testInfo, 'item13-exercise-drafts-retired', { status })
})

type CommonMistake = { text: string; errorCause: string | null }
type StoredMessage = {
  id: string
  role: string
  structured?: { kind?: string; commonMistakes?: CommonMistake[] } | null
}

const ERROR_CAUSES = ['structural', 'deviation', 'application', 'metacognitive']

test('item 14: Ask answers carry their common mistakes, and Ask shows them (#722, backend #514)', {
  tag: ['@item14', '@readonly'],
}, async ({ page, request, baseURL }, testInfo) => {
  // Read from student@'s newest conversations; nothing is asked. Whether a new
  // answer gets one or two is the model's, and is item 14's generation half.
  const api = await SmokeApi.signIn(request, baseURL!, 'student')
  const list = await api.call<{ items: Array<{ id: string; updatedAt: string }> }>('GET', '/conversations', {
    expect: 200,
  })
  const newest = [...list.body.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8)
  let answers = 0
  let followUps = 0
  let withMistakes: { conversationId: string; messageId: string; mistakes: CommonMistake[] } | null = null
  for (const conversation of newest) {
    const { body } = await api.call<{ messages: StoredMessage[] }>('GET', `/conversations/${conversation.id}`, {
      expect: 200,
    })
    for (const message of body.messages) {
      const structured = message.structured
      if (message.role !== 'assistant' || !structured || !['answer', 'followUp'].includes(structured.kind ?? '')) continue
      const where = `${conversation.id}/${message.id}`
      // Always an array, never null; an answer from before #514 reads [].
      expect(Array.isArray(structured.commonMistakes), `${where}: commonMistakes is an array`).toBe(true)
      const mistakes = structured.commonMistakes!
      expect(mistakes.length, `${where}: at most two`).toBeLessThanOrEqual(2)
      for (const mistake of mistakes) {
        expect(mistake.text.trim(), `${where}: a mistake has words`).not.toBe('')
        expect(mistake.text.length, `${where}: at most 300 characters`).toBeLessThanOrEqual(300)
        expect(mistake.text, `${where}: one line`).not.toMatch(/\n/)
        expect([...ERROR_CAUSES, null], `${where}: errorCause`).toContain(mistake.errorCause)
      }
      if (structured.kind === 'followUp') {
        followUps += 1
        expect(mistakes, `${where}: a follow-up has none`).toEqual([])
      } else {
        answers += 1
        if (mistakes.length > 0 && !withMistakes) {
          withMistakes = { conversationId: conversation.id, messageId: message.id, mistakes }
        }
      }
    }
  }
  await record(testInfo, 'item14-common-mistakes-stored', {
    conversationsRead: newest.length,
    answers,
    followUps,
    withMistakes,
    knownConversations: deploymentState(baseURL!).studentConversationIds.length,
  })
  if (!withMistakes) {
    testInfo.annotations.push({ type: 'coverage', description: 'student@ 最近的回答都没有常见错误：屏幕上的板块未读' })
    return
  }

  // The answer that has some, in Ask: its own section, one entry each.
  const failures = watchApiFailures(page)
  const errors = watchPageErrors(page)
  await signIn(page, 'student')
  await page.goto(`/ask/${withMistakes.conversationId}`)
  const section = page.locator('[data-answer-section="commonMistakes"]')
  await expect(section.first(), 'the common mistakes section').toBeVisible({ timeout: 20_000 })
  const entries = section.first().getByRole('list', { name: anyLanguage('chat', 'ask.answer.commonMistakes') })
  await expect(entries, 'the section is labelled in the page language').toBeVisible()
  const shown = await entries.getByRole('listitem').allInnerTexts()
  expect(shown.length, 'some answer shows its mistakes').toBeGreaterThan(0)
  expect(errors, 'uncaught page errors').toEqual([])
  // A conversation nobody escalated answers 404 on its teacher-help request.
  await expectApiClean(failures, [
    {
      method: 'GET',
      path: /\/teacher-help\/conversations\/[^/]+\/request$/,
      status: 404,
      optional: true,
      why: 'no teacher help was asked for',
    },
  ])
})
