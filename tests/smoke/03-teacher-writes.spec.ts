import { expect, test, type APIRequestContext } from '@playwright/test'
import { ANSWER_WAIT_LIMIT_MS, SmokeApi, askViaApi, timedOutNote } from './api'
import { expectApiClean, signIn, watchApiFailures, watchPageErrors } from './helpers'
import { findErrorCode, screenAnswer, type Screen } from './judge'
import { anyLanguage } from './locales'
import { record, rememberConversations } from './run'

// The teacher side of 2026-11-20 that writes (items 11-13). Off unless
// `STOA_SMOKE_TEACHER_WRITES=1`, until the coordinator has read a first run
// (decided 2026-11-20). Nothing here asks a model.
//
// What is written, on the test accounts, and what is put back:
//
//   item 11  student@ asks teacher@ for help in one conversation: one of
//            student@'s cases for that way this Zurich week, not given back.
//            Sent only while teacher@ is the one teacher on dispatch (backend
//            #472: dispatch offers only to teachers who are available and
//            online), so no real teacher is offered it. teacher@ is normally
//            paused (decided 2026-11-20), so a real student's request is never
//            offered to it; it is made available just for this request and put
//            back to paused right after it takes it, whatever its status was.
//            A classroom request opens a Daily room.
//            The request is resolved in `afterAll`; resolved, it still lets
//            teacher@ assign practice to student@ for 14 days (CONTEXT.md,
//            布置练习的权限), which items 12 and 13 need.
//   item 12  one exercise assigned to student@ through the automation, then
//            archived by teacher@ in the same test.
//   item 13  one exercise draft from the bank, accepted and delivered to
//            student@ as an assignment, then the assignment and the draft
//            archived. The backend has no delete: archived rows stay, hidden
//            from the student.
//   item 14  one German equation question in Ask as student@: one generation
//            request, the run's fourth of five, and a conversation in
//            student@'s history like items 2 and 3. Behind the same switch
//            until confirmed; then it belongs with the other @generation items.

const ENABLED = process.env.STOA_SMOKE_TEACHER_WRITES === '1'
const SUBJECT = 'math'
const MARK = '[smoke] item 11'

type HelpMode = 'text' | 'classroom'
type ModeStanding = { canRequest: boolean; blockedReason?: string | null; remainingCases: number }
type StudentAvailability = {
  availableTeachers: number
  teacherSupport: { text: ModeStanding; classroom: ModeStanding } | null
}
type TeacherOwnAvailability = { status?: 'available' | 'paused' | null; subjects?: string[] }
type HelpSummary = {
  requestId: string
  conversationId: string
  studentId: string
  status: string
  mode?: string
  createdAt: string
}
type StudentHelpView = { requestId: string; conversationId: string; status: string; mode: string; teacherName?: string | null }
type ClassroomEntry = { whiteboardUrl: string; voice: { roomUrl: string; token: string }; expiresAt: string }
type Assignment = { assignmentId: string; sourceType: string; sourceId?: string; status: string }

const isMath = (subject: string) => ['math', 'mathematics', 'mathematik'].includes(subject.trim().toLowerCase())

async function userId(api: SmokeApi): Promise<string> {
  const { body } = await api.call<{ id: string }>('GET', '/auth/me', { expect: 200 })
  return body.id
}

async function helpRequests(teacher: SmokeApi): Promise<HelpSummary[]> {
  return (await teacher.call<{ items: HelpSummary[] }>('GET', '/teachers/me/help-requests', { expect: 200 })).body.items
}

/** The smoke's own request for student@ that gives teacher@ the relation: held first, then resolved. */
async function smokeRelation(teacher: SmokeApi, studentId: string): Promise<HelpSummary | null> {
  const mine = (await helpRequests(teacher)).filter((item) => item.studentId === studentId)
  return mine.find((item) => item.status === 'in_progress') ?? mine.find((item) => item.status === 'resolved') ?? null
}

async function myAssignments(student: SmokeApi): Promise<Assignment[]> {
  return (await student.call<{ items: Assignment[] }>('GET', '/adaptive/students/me/assignments', { expect: 200 })).body.items
}

async function apis(request: APIRequestContext, baseURL: string) {
  const student = await SmokeApi.signIn(request, baseURL, 'student')
  const teacher = await SmokeApi.signIn(request, baseURL, 'teacher')
  return { student, teacher, studentId: await userId(student) }
}

test.describe('the teacher side that writes (items 11-13)', () => {
  test.skip(!ENABLED, 'STOA_SMOKE_TEACHER_WRITES is not 1: the teacher write items wait for the coordinator')

  // Whatever happened, no request of student@'s stays open on teacher@: both
  // are test accounts, so any held between them is the smoke's.
  test.afterAll(async ({ playwright }, testInfo) => {
    if (!ENABLED) return
    const request = await playwright.request.newContext()
    try {
      const { teacher, studentId } = await apis(request, testInfo.project.use.baseURL!)
      const open = (await helpRequests(teacher)).filter(
        (item) => item.studentId === studentId && item.status === 'in_progress',
      )
      for (const item of open) {
        await teacher.call('PATCH', `/teachers/me/help-requests/${item.requestId}`, {
          data: { status: 'resolved' },
          expect: 200,
        })
      }
      await record(testInfo, 'item11-resolved', { resolved: open.map((item) => item.requestId) })
    } finally {
      await request.dispose()
    }
  })

  test('item 11: a help request keeps the way it was asked, from the student to the teacher (#719, backend #480 #481)', {
    tag: ['@item11'],
  }, async ({ page, request, baseURL }, testInfo) => {
    test.setTimeout(180_000)
    const { student, teacher, studentId } = await apis(request, baseURL!)

    // The way: the one forced by STOA_SMOKE_HELP_MODE, else the classroom when
    // student@ may ask for one this week, else a text answer.
    const standing = (await student.call<StudentAvailability>('GET', '/teacher-help/availability', { expect: 200 })).body
    expect(standing.teacherSupport, 'student@\'s week could be read').not.toBeNull()
    const forced = process.env.STOA_SMOKE_HELP_MODE
    const mode: HelpMode = forced === 'text' || forced === 'classroom'
      ? forced
      : standing.teacherSupport!.classroom.canRequest ? 'classroom' : 'text'
    const way = standing.teacherSupport![mode]
    if (!way.canRequest) {
      await record(testInfo, 'item11-help-request', { asked: false, mode, standing: way, note: '本周这种方式不能再求助，未发' })
      test.skip(true, `student@ cannot ask for ${mode} this week (${way.blockedReason})`)
      return
    }

    // teacher@ on dispatch, and alone there.
    const own = (await teacher.call<TeacherOwnAvailability>('GET', '/teachers/me/availability', { expect: 200 })).body
    if (!(own.subjects ?? []).some(isMath)) {
      await record(testInfo, 'item11-help-request', { asked: false, mode, teacherSubjects: own.subjects ?? [], note: 'teacher@ 不教数学，未发' })
      test.skip(true, 'teacher@ has no maths among its subjects')
      return
    }
    const statusBefore = own.status ?? null
    let requestId = ''
    let conversationId = ''
    let offered: HelpSummary | undefined
    try {
      await teacher.call('PATCH', '/teachers/me/availability', { data: { status: 'available' }, expect: 200 })
      await helpRequests(teacher) // the heartbeat that makes teacher@ online
      const onDispatch = (await student.call<StudentAvailability>('GET', '/teacher-help/availability', { expect: 200 }))
        .body.availableTeachers
      if (onDispatch !== 1) {
        await record(testInfo, 'item11-help-request', {
          asked: false,
          mode,
          availableTeachers: onDispatch,
          note: '除 teacher@ 外还有老师在线（或 teacher@ 不在），未发，以免派给真实老师',
        })
        test.skip(true, `${onDispatch} teachers on dispatch; the request would not be sure to reach teacher@`)
        return
      }

      const grade = (await student.call<{ grade: string }>('GET', '/students/me/profile', { expect: 200 })).body.grade
      conversationId = (await student.call<{ id: string }>('POST', '/conversations', {
        data: { subject: SUBJECT, grade },
        expect: 201,
      })).body.id
      const asked = await student.call<StudentHelpView>('POST', '/teacher-help/request', {
        data: { conversationId, message: `${MARK}: ${mode}`, mode },
        expect: 200,
      })
      requestId = asked.body.requestId
      expect(asked.body.mode, 'the request is stored with the way asked').toBe(mode)

      // Offered to teacher@, the one teacher on dispatch.
      try {
        await expect.poll(async () => {
          offered = (await helpRequests(teacher)).find((item) => item.conversationId === conversationId)
          return offered?.requestId ?? null
        }, { timeout: 60_000, message: 'the request reached teacher@\'s queue' }).toBe(requestId)
      } catch (error) {
        // Somebody else has it, or nobody: take it back, which gives the case back.
        const withdrawn = await student.call<StudentHelpView>(
          'POST',
          `/teacher-help/conversations/${conversationId}/request/withdraw`,
          { expect: [200, 409] },
        )
        await record(testInfo, 'item11-help-request', { asked: true, mode, requestId, conversationId, withdrawn: withdrawn.body })
        throw error
      }
      expect(offered!.mode, 'teacher@\'s queue says the same way').toBe(mode)
      expect(offered!.studentId, 'and names student@').toBe(studentId)

      const taken = await teacher.call<HelpSummary>('PATCH', `/teachers/me/help-requests/${requestId}`, {
        data: { status: 'in_progress' },
        expect: 200,
      })
      expect(taken.body.status, 'teacher@ took the request').toBe('in_progress')
      expect(taken.body.mode, 'taking it keeps the way').toBe(mode)
    } finally {
      // Off dispatch again as soon as teacher@ no longer has to be on it, and
      // paused even if it was found available: that is its normal state.
      await teacher.call('PATCH', '/teachers/me/availability', { data: { status: 'paused' }, expect: 200 })
    }

    const seen = (await student.call<StudentHelpView>('GET', `/teacher-help/conversations/${conversationId}/request`, {
      expect: 200,
    })).body
    expect(seen.status, 'student@ reads it as taken').toBe('in_progress')
    expect(seen.mode, 'student@ reads the same way').toBe(mode)

    // Only a classroom request has a classroom (backend #481), for both sides.
    let classroom: Record<string, unknown>
    if (mode === 'classroom') {
      const forTeacher = await teacher.call<ClassroomEntry>('POST', `/teachers/me/help-requests/${requestId}/classroom`, { expect: 200 })
      const forStudent = await student.call<ClassroomEntry>('POST', `/conversations/${conversationId}/classroom`, { expect: 200 })
      expect(forTeacher.body.whiteboardUrl, 'the teacher\'s whiteboard').toMatch(/^https:\/\//)
      expect(forTeacher.body.voice.token, 'the teacher\'s voice token').toBeTruthy()
      expect(forStudent.body.voice.roomUrl, 'one voice room for both').toBe(forTeacher.body.voice.roomUrl)
      // Never the tokens themselves.
      classroom = { teacher: forTeacher.status, student: forStudent.status, expiresAt: forTeacher.body.expiresAt }
    } else {
      const refused = await teacher.call('POST', `/teachers/me/help-requests/${requestId}/classroom`, { expect: 409 })
      expect(findErrorCode(refused.body)?.code, 'a text request has no classroom').toBe('help_request_not_classroom')
      classroom = { teacher: refused.status, code: 'help_request_not_classroom' }
    }
    await record(testInfo, 'item11-help-request', {
      asked: true,
      mode,
      requestId,
      conversationId,
      teacherStatusBefore: statusBefore,
      teacherStatusAfter: 'paused',
      studentView: { status: seen.status, mode: seen.mode, teacherName: seen.teacherName ?? null },
      classroom,
      note: `student@ 本周的${mode === 'classroom' ? '课堂' : '文字'}求助用掉一次，不归还`,
    })

    // teacher@'s page for it: one Mark resolved, and the classroom door when it is one.
    const failures = watchApiFailures(page)
    const errors = watchPageErrors(page)
    await signIn(page, 'teacher')
    await page.goto(`/teacher/requests/${requestId}`)
    await expect(page.getByRole('button', { name: anyLanguage('teacher', 'markResolved') })).toBeVisible({ timeout: 20_000 })
    const door = page.getByText(anyLanguage('teacher', 'detail.enterClassroom'))
    if (mode === 'classroom') {
      await expect(door.first(), 'the classroom section').toBeVisible()
    } else {
      await expect(door, 'no classroom for a text answer').toHaveCount(0)
    }
    expect(errors, 'uncaught page errors').toEqual([])
    await expectApiClean(failures)
  })

  test('item 12: practice assigned to a helped student reaches their list (#720, backend #495)', {
    tag: ['@item12'],
  }, async ({ request, baseURL }, testInfo) => {
    const { student, teacher, studentId } = await apis(request, baseURL!)
    const relation = await smokeRelation(teacher, studentId)
    if (!relation) {
      await record(testInfo, 'item12-assign-practice', { assigned: false, note: 'teacher@ 没接过 student@ 的求助：先跑第 11 项' })
      test.skip(true, 'teacher@ has not helped student@; run item 11 first')
      return
    }

    // One exercise at most, assigned rather than suggested, as the page sends
    // it. The test student's evidence is thin and old, so the two settings a
    // teacher can move under "More options" are opened up: any confidence, and
    // evidence as old as the backend allows (`freshnessDays` le=180). Item
    // 12's read-only run found all five candidates refused under the
    // defaults: two stale, three of a source the page does not assign
    // (memory snapshots and lesson topics, which an assignment cannot be
    // made from), so the page's two source types are kept.
    const policy = {
      autonomyLevel: 'teacher_approved_batch',
      deliveryMode: 'assigned',
      maxAssignmentsPerStudent: 1,
      confidenceThreshold: 'low',
      freshnessDays: 180,
    }
    const preview = (await teacher.call<{
      batchId: string
      selected: Array<Record<string, unknown>>
      refused: Array<{ refusalCode?: string }>
    }>('POST', `/adaptive/students/${studentId}/assignment-automation/batches/preview`, {
      data: { policy },
      expect: 200,
    })).body
    const chosen = preview.selected[0]
    if (!chosen) {
      await record(testInfo, 'item12-assign-practice', {
        assigned: false,
        relation: relation.status,
        refused: preview.refused.map((item) => item.refusalCode ?? null),
        note: '没有可布置的候选，执行未读',
      })
      testInfo.annotations.push({ type: 'coverage', description: '没有可布置的候选：执行和学生端未读' })
      return
    }

    // What `toExecuteCandidate` sends back (src/features/assignPractice/executeCandidate.ts).
    const FIELDS = ['candidateId', 'type', 'sourceType', 'sourceId', 'title', 'subject', 'topicId', 'topicIds',
      'confidence', 'rationale', 'expectedImpact', 'reviewStatus', 'proposedStatus', 'dueAt', 'sourceSignals',
      'reviewRequired', 'autonomousDecision']
    const candidate: Record<string, unknown> = { approved: true }
    for (const field of FIELDS) {
      if (chosen[field] !== null && chosen[field] !== undefined) candidate[field] = chosen[field]
    }

    const created: string[] = []
    try {
      const executed = (await teacher.call<{ results: Array<{ assignmentId?: string; status?: string; reasonCode?: string }> }>(
        'POST',
        `/adaptive/students/${studentId}/assignment-automation/batches/execute`,
        { data: { batchId: preview.batchId, approved: true, policy, candidates: [candidate] }, expect: 200 },
      )).body
      created.push(...executed.results.map((result) => result.assignmentId).filter((id): id is string => Boolean(id)))
      expect(created, 'one assignment made').toHaveLength(1)
      const listed = await myAssignments(student)
      expect(listed.map((item) => item.assignmentId), 'student@ sees it under Assignments').toContain(created[0])
      await record(testInfo, 'item12-assign-practice', {
        assigned: true,
        relation: relation.status,
        candidate: { sourceType: chosen.sourceType, sourceId: chosen.sourceId, rationaleCode: chosen.rationaleCode },
        results: executed.results.map((result) => ({ status: result.status, reasonCode: result.reasonCode ?? null })),
        assignmentId: created[0],
      })
    } finally {
      for (const id of created) {
        await teacher.call('POST', `/adaptive/assignments/${id}/archive`, { data: { note: 'smoke item 12' }, expect: 200 })
      }
    }
    const after = await myAssignments(student)
    expect(after.map((item) => item.assignmentId), 'archived, it is gone from student@\'s list').not.toContain(created[0])
  })

  test('item 13: a bank exercise draft is accepted and delivered once (backend #519 #535)', {
    tag: ['@item13'],
  }, async ({ request, baseURL }, testInfo) => {
    const { student, teacher, studentId } = await apis(request, baseURL!)
    const relation = await smokeRelation(teacher, studentId)
    if (!relation) {
      await record(testInfo, 'item13-exercise-draft', { delivered: false, note: 'teacher@ 没接过 student@ 的求助：先跑第 11 项' })
      test.skip(true, 'teacher@ has not helped student@; run item 11 first')
      return
    }

    // A maths topic of student@'s year with published exercises: the backend
    // refuses one without (`no_bank_exercises`) rather than make one up.
    const grade = (await student.call<{ grade: string }>('GET', '/students/me/profile', { expect: 200 })).body.grade
    const catalog = (await teacher.call<{ topics: Array<{ id: string; subjectId: string; gradeLevel: string }> }>(
      'GET',
      '/practice/curriculum/catalog',
      { expect: 200 },
    )).body
    const year = grade.replace(/\D/g, '')
    const topics = catalog.topics
      .filter((topic) => isMath(topic.subjectId))
      .sort((a, b) => Number(b.gradeLevel.replace(/\D/g, '') === year) - Number(a.gradeLevel.replace(/\D/g, '') === year))
      .slice(0, 5)
    expect(topics.length, 'the catalog has maths topics').toBeGreaterThan(0)

    type Draft = {
      draftId: string
      status: string
      difficulty: string
      items: Array<Record<string, unknown>>
      answerKey: Array<Record<string, unknown>>
      studentDeliveryStatus: string
      deliveredAssignmentId?: string | null
    }
    let draft: Draft | null = null
    const tried: Array<{ topicId: string; status: number; code: string | null }> = []
    for (const topic of topics) {
      const made = await teacher.call<Draft>('POST', '/teachers/ai-tools/exercise-drafts', {
        data: {
          studentId,
          subject: SUBJECT,
          topicIds: [topic.id],
          difficulty: 'standard',
          exerciseCount: 2,
          questionId: relation.requestId,
        },
        expect: [200, 400],
      })
      const code = made.status === 400 ? findErrorCode(made.body)?.code ?? null : null
      tried.push({ topicId: topic.id, status: made.status, code })
      if (made.status === 200) {
        draft = made.body
        break
      }
      expect(code, `a refused draft is refused for want of bank exercises (${topic.id})`).toBe('no_bank_exercises')
    }
    if (!draft) {
      await record(testInfo, 'item13-exercise-draft', { delivered: false, tried, note: '前 5 个数学主题都没有已发布的题' })
      throw new Error('no maths topic among the first five has published exercises')
    }

    let assignmentId: string | null = null
    try {
      expect(draft.difficulty, 'the difficulty the teacher chose').toBe('standard')
      expect(draft.items.length, 'one to five exercises').toBeGreaterThan(0)
      expect(draft.items.length, 'one to five exercises').toBeLessThanOrEqual(5)
      expect(draft.answerKey, 'an answer for each exercise, for the teacher').toHaveLength(draft.items.length)
      expect(draft.studentDeliveryStatus, 'nothing delivered before review').toBe('not_delivered')

      const accepted = (await teacher.call<Draft>('POST', `/teachers/ai-tools/drafts/${draft.draftId}/accept`, { expect: 200 })).body
      expect(accepted.status, 'accepted').toBe('accepted')
      expect(accepted.studentDeliveryStatus, 'accepting alone delivers nothing').toBe('not_delivered')

      const deliver = { studentId, sourceType: 'ai_draft', sourceId: draft.draftId }
      const first = (await teacher.call<Assignment>('POST', '/adaptive/assignments', { data: deliver, expect: [200, 201] })).body
      assignmentId = first.assignmentId
      const again = (await teacher.call<Assignment>('POST', '/adaptive/assignments', { data: deliver, expect: [200, 201] })).body
      expect(again.assignmentId, 'a draft becomes one assignment, however often it is sent').toBe(assignmentId)

      const delivered = (await teacher.call<Draft>('GET', `/teachers/ai-tools/drafts/${draft.draftId}`, { expect: 200 })).body
      expect(delivered.studentDeliveryStatus, 'the draft is marked delivered').toBe('delivered')
      expect(delivered.deliveredAssignmentId, 'with its assignment').toBe(assignmentId)
      const listed = await myAssignments(student)
      expect(listed.map((item) => item.assignmentId), 'student@ sees it under Assignments').toContain(assignmentId)

      await record(testInfo, 'item13-exercise-draft', {
        delivered: true,
        relation: relation.status,
        tried,
        draftId: draft.draftId,
        exercises: draft.items.length,
        assignmentId,
      })
    } finally {
      if (assignmentId) {
        await teacher.call('POST', `/adaptive/assignments/${assignmentId}/archive`, { data: { note: 'smoke item 13' }, expect: 200 })
      }
      await teacher.call('POST', `/teachers/ai-tools/drafts/${draft.draftId}/archive`, { data: { note: 'smoke item 13' }, expect: 200 })
    }
    const after = await myAssignments(student)
    expect(after.map((item) => item.assignmentId), 'archived, it is gone from student@\'s list').not.toContain(assignmentId)
  })
})

const ERROR_CAUSES = ['structural', 'deviation', 'application', 'metacognitive']

test('item 14: a new equation question is answered with its common mistakes, on screen (#722, backend #514)', {
  tag: ['@item14', '@generation'],
}, async ({ page, request, baseURL }, testInfo) => {
  test.skip(!ENABLED, 'STOA_SMOKE_TEACHER_WRITES is not 1: item 14 waits for the coordinator')
  test.setTimeout(ANSWER_WAIT_LIMIT_MS + 90_000)
  // A question with mistakes everybody makes (the 3 not multiplied into the
  // bracket, a sign lost moving a term), so an answer without any is the
  // feature failing, not the model judging there were none (decided
  // 2026-11-20; the derivative of item 3 is a concept question and may have
  // none). 3(x - 2) = 2x + 5 gives x = 11.
  const api = await SmokeApi.signIn(request, baseURL!, 'student')
  const grade = (await api.call<{ grade: string }>('GET', '/students/me/profile', { expect: 200 })).body.grade
  const asked = await askViaApi(api, {
    label: 'item14-common-mistakes',
    subject: 'math',
    grade,
    content: 'Wie löse ich die Gleichung 3(x - 2) = 2x + 5?',
    acceptLanguage: 'de',
  })
  rememberConversations(baseURL!, [asked.conversationId])
  const base = {
    conversationId: asked.conversationId,
    idempotencyKey: asked.idempotencyKey,
    sendStatus: asked.sendStatus,
    acceptMs: asked.acceptMs,
    outcome: asked.outcome,
  }
  if (asked.outcome.kind !== 'completed') {
    await record(testInfo, 'item14-common-mistakes-answer', {
      ...base,
      note: asked.outcome.kind === 'timed_out' ? timedOutNote(asked.outcome) : null,
    })
    if (asked.outcome.kind === 'timed_out') throw new Error(timedOutNote(asked.outcome))
  }
  expect(asked.outcome, 'the command ended in a successful terminal state').toMatchObject({ kind: 'completed' })
  const assistantId = (asked.outcome as { assistantMessageId: string }).assistantMessageId

  const detail = (await api.call<{
    messages: Array<{ id: string; structured?: { kind?: string; commonMistakes?: Array<{ text: string; errorCause: string | null }> } | null }>
  }>('GET', `/conversations/${asked.conversationId}`, { expect: 200 })).body
  const structured = detail.messages.find((message) => message.id === assistantId)?.structured ?? null
  const mistakes = structured?.commonMistakes ?? null
  const screen: Screen = { language: 'de', topic: /Klammer|ausmultiplizier|Gleichung|x\s*=\s*11/i, minLength: 40 }
  const problems = screenAnswer(asked.answer ?? '', screen)
  // Written before the checks, so a failure still leaves the answer for a person.
  await record(testInfo, 'item14-common-mistakes-answer', {
    ...base,
    kind: structured?.kind ?? null,
    commonMistakes: mistakes,
    screenProblems: problems,
    answer: asked.answer,
    needsHumanConfirmation: {
      language: 'de',
      explainsRatherThanRefuses: true,
      mistakesAreTypicalForThisQuestion: true,
    },
  })

  expect(structured?.kind, 'a new question gets an answer, not a follow-up').toBe('answer')
  expect(Array.isArray(mistakes), 'commonMistakes is an array').toBe(true)
  expect(mistakes!.length, 'one or two common mistakes').toBeGreaterThanOrEqual(1)
  expect(mistakes!.length, 'one or two common mistakes').toBeLessThanOrEqual(2)
  for (const mistake of mistakes!) {
    expect(mistake.text.trim(), 'a mistake has words').not.toBe('')
    expect(mistake.text.length, 'at most 300 characters').toBeLessThanOrEqual(300)
    expect(mistake.text, 'one line').not.toMatch(/\n/)
    expect([...ERROR_CAUSES, null], 'errorCause').toContain(mistake.errorCause)
  }
  expect.soft(problems, 'keyword screen (a person still reads the answer)').toEqual([])

  // Ask shows them under that answer, one entry each.
  const failures = watchApiFailures(page)
  const errors = watchPageErrors(page)
  await signIn(page, 'student')
  await page.goto(`/ask/${asked.conversationId}`)
  const entries = page
    .locator('[data-answer-section="commonMistakes"]')
    .getByRole('list', { name: anyLanguage('chat', 'ask.answer.commonMistakes') })
  await expect(entries, 'the common mistakes section').toBeVisible({ timeout: 20_000 })
  await expect(entries.getByRole('listitem'), 'one entry per mistake').toHaveCount(mistakes!.length)
  expect(errors, 'uncaught page errors').toEqual([])
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
