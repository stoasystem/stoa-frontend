/**
 * Every value a service puts into an API path stays inside its own segment
 * (#251). Ids often come from the address, which the router has already
 * decoded: `x%252F..` reaches the page as `x/..`, and inserted as it is that
 * walks the request to another API path (#91). Each call is made twice: with a
 * plain id, which must give exactly the path it always gave, and with an id
 * holding `/`, `?` and `#`, which must stay one encoded segment.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/services/api/httpClient'
import { apiBaseUrl } from '@/lib/env'
import { apiPath } from '@/services/api/apiPath'
import * as accountsApi from '@/services/admin/accountsApi'
import * as adminApi from '@/services/admin/adminApi'
import * as adminBillingApi from '@/services/admin/adminBillingApi'
import * as curriculumApi from '@/services/admin/curriculumApi'
import * as billingApi from '@/services/billing/billingApi'
import * as chatApi from '@/services/chat/chatApi'
import * as chatStreamApi from '@/services/chat/chatStreamApi'
import * as fileApi from '@/services/files/fileApi'
import * as learningOperationsApi from '@/services/learning/learningOperationsApi'
import * as learningProfileApi from '@/services/learning/learningProfileApi'
import * as notificationApi from '@/services/notifications/notificationApi'
import * as parentApi from '@/services/parent/parentApi'
import * as parentReportApi from '@/services/parent/parentReportApi'
import * as practiceApi from '@/services/practice/practiceApi'
import * as teacherApi from '@/services/teacher/teacherApi'
import * as teacherApplicationApi from '@/services/teacher/teacherApplicationApi'
import * as teacherHelpApi from '@/services/teacherHelp/teacherHelpApi'

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const PLAIN = 'id-1'
const HOSTILE = 'a/../b?c=1#d'
const HOSTILE_SEGMENT = 'a%2F..%2Fb%3Fc%3D1%23d'

const methods = ['get', 'post', 'put', 'patch', 'delete'] as const
const seen: string[] = []
const fetchMock = vi.fn()

beforeEach(() => {
  seen.length = 0
  for (const method of methods) {
    vi.mocked(httpClient[method]).mockReset()
    vi.mocked(httpClient[method]).mockImplementation(async (url: string) => {
      seen.push(`${method.toUpperCase()} ${url}`)
      // An upload intent names the upload whose chunks follow.
      if (url === '/files/intents') {
        return { status: 200, data: { uploadId: currentId, maxBytes: 100, acceptedTypes: [], chunkBytes: 100 } }
      }
      return { status: 200, data: {} }
    })
  }
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string) => {
    seen.push(`FETCH ${url.slice(apiBaseUrl.length)}`)
    return new Response(null, { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

let currentId = PLAIN

type Case = {
  name: string
  call: (id: string) => Promise<unknown>
  // The requests the call makes, with `id` where the value goes.
  requests: (id: string) => string[]
}

const any = <T,>(value: object) => value as T

// The expected paths are spelt out by hand, as they read before #251, so a
// plain id is held to the exact path it always produced.
const cases: Record<string, Case[]> = {
  accountsApi: [
    { name: 'reissueInvitation', call: (id) => accountsApi.reissueInvitation({ invitationId: id }), requests: (id) => [`POST /admin/users/invitations/${id}/reissue`] },
    { name: 'revokeInvitation', call: (id) => accountsApi.revokeInvitation(id), requests: (id) => [`DELETE /admin/users/invitations/${id}`] },
    { name: 'resetAccountPassword', call: (id) => accountsApi.resetAccountPassword({ userId: id, reason: 'r' }), requests: (id) => [`POST /admin/users/${id}/password-reset`] },
    { name: 'changeAccountStatus', call: (id) => accountsApi.changeAccountStatus(any({ userId: id, status: 'active', reason: 'r' })), requests: (id) => [`POST /admin/users/${id}/status`] },
    { name: 'updateAccountProfile', call: (id) => accountsApi.updateAccountProfile(any({ userId: id })), requests: (id) => [`PATCH /admin/users/${id}`] },
    { name: 'readTeacherSupportAllowance', call: (id) => accountsApi.readTeacherSupportAllowance(id), requests: (id) => [`GET /admin/teacher-support/allowances/${id}`] },
    { name: 'setTeacherSupportAllowance', call: (id) => accountsApi.setTeacherSupportAllowance(any({ studentId: id })), requests: (id) => [`PUT /admin/teacher-support/allowances/${id}`] },
  ],
  adminApi: [
    { name: 'createModerationReport', call: (id) => adminApi.createModerationReport(any({ questionId: id })), requests: (id) => [`POST /questions/${id}/reports`] },
    { name: 'getModerationCase', call: (id) => adminApi.getModerationCase(id), requests: (id) => [`GET /admin/moderation/cases/${id}`] },
    { name: 'updateModerationCase', call: (id) => adminApi.updateModerationCase(any({ caseId: id })), requests: (id) => [`PATCH /admin/moderation/cases/${id}`] },
    { name: 'addModerationCaseNote', call: (id) => adminApi.addModerationCaseNote(any({ caseId: id, note: 'n' })), requests: (id) => [`POST /admin/moderation/cases/${id}/notes`] },
    { name: 'getReportOperationDetail', call: (id) => adminApi.getReportOperationDetail({ parent_id: id, student_id: id, week_start: id }), requests: (id) => [`GET /admin/reports/${id}/${id}/${id}/ops`] },
    { name: 'retryReportGeneration', call: (id) => adminApi.retryReportGeneration({ parent_id: id, student_id: id, week_start: id }), requests: (id) => [`POST /admin/reports/${id}/${id}/${id}/retry-generation`] },
    { name: 'resendReportEmail', call: (id) => adminApi.resendReportEmail({ parent_id: id, student_id: id, week_start: id }), requests: (id) => [`POST /admin/reports/${id}/${id}/${id}/resend`] },
    { name: 'getReportAuditEvents', call: (id) => adminApi.getReportAuditEvents({ parent_id: id, student_id: id, week_start: id }), requests: (id) => [`GET /admin/reports/${id}/${id}/${id}/audit`] },
    { name: 'previewResumeRecoveryJob', call: (id) => adminApi.previewResumeRecoveryJob({ jobId: id, reason: 'r', results: [] }), requests: (id) => [`POST /admin/reports/recovery-jobs/${id}/resume/preview`] },
    { name: 'createResumeRecoveryJob', call: (id) => adminApi.createResumeRecoveryJob({ jobId: id, reason: 'r', results: [], preview_token: 't' }), requests: (id) => [`POST /admin/reports/recovery-jobs/${id}/resume`] },
    { name: 'getRecoveryJob', call: (id) => adminApi.getRecoveryJob(id), requests: (id) => [`GET /admin/reports/recovery-jobs/${id}`] },
    { name: 'getRecoveryJobResults', call: (id) => adminApi.getRecoveryJobResults(id), requests: (id) => [`GET /admin/reports/recovery-jobs/${id}/results`] },
    { name: 'getRecoveryJobAuditEvents', call: (id) => adminApi.getRecoveryJobAuditEvents(id), requests: (id) => [`GET /admin/reports/recovery-jobs/${id}/audit`] },
    { name: 'cancelRecoveryJob', call: (id) => adminApi.cancelRecoveryJob(id), requests: (id) => [`POST /admin/reports/recovery-jobs/${id}/cancel`] },
    { name: 'getSubscriptionRequest', call: (id) => adminApi.getSubscriptionRequest(id), requests: (id) => [`GET /admin/subscriptions/requests/${id}`] },
    { name: 'getSubscriptionBillingDetail', call: (id) => adminApi.getSubscriptionBillingDetail(id), requests: (id) => [`GET /admin/subscriptions/billing/${id}`] },
    { name: 'getAdminParentAccountOperations', call: (id) => adminApi.getAdminParentAccountOperations(id), requests: (id) => [`GET /admin/account-operations/parents/${id}`] },
    { name: 'updateSubscriptionRequest', call: (id) => adminApi.updateSubscriptionRequest(any({ requestId: id })), requests: (id) => [`PATCH /admin/subscriptions/requests/${id}`] },
    { name: 'applySubscriptionRequest', call: (id) => adminApi.applySubscriptionRequest({ requestId: id }), requests: (id) => [`POST /admin/subscriptions/requests/${id}/apply`] },
    { name: 'getAdminBillingOperation', call: (id) => adminApi.getAdminBillingOperation(id, 'p'), requests: (id) => [`GET /admin/billing/checkouts/${id}`] },
    { name: 'recheckAdminBillingOperation', call: (id) => adminApi.recheckAdminBillingOperation(id, 'p'), requests: (id) => [`POST /admin/billing/checkouts/${id}/recheck`] },
  ],
  adminBillingApi: [
    { name: 'getAdminCheckoutDetail', call: (id) => adminBillingApi.getAdminCheckoutDetail(id), requests: (id) => [`GET /admin/billing/checkouts/${id}`] },
    { name: 'recheckAdminCheckout', call: (id) => adminBillingApi.recheckAdminCheckout(id), requests: (id) => [`POST /admin/billing/checkouts/${id}/recheck`] },
  ],
  curriculumApi: [
    { name: 'getCurriculumPreview', call: (id) => curriculumApi.getCurriculumPreview(id, 'v'), requests: (id) => [`GET /admin/curriculum/lessons/${id}/preview`] },
    { name: 'patchCurriculumDraft', call: (id) => curriculumApi.patchCurriculumDraft(any({ publicLessonId: id, versionId: id, payload: {} })), requests: (id) => [`PATCH /admin/curriculum/lessons/${id}/drafts/${id}`] },
    { name: 'getCurriculumValidationPreview', call: (id) => curriculumApi.getCurriculumValidationPreview(id, id), requests: (id) => [`POST /admin/curriculum/lessons/${id}/drafts/${id}/validation-preview`] },
    { name: 'getCurriculumDiff', call: (id) => curriculumApi.getCurriculumDiff(id, 'a', 'b'), requests: (id) => [`GET /admin/curriculum/lessons/${id}/diff`] },
    { name: 'getCurriculumAudit', call: (id) => curriculumApi.getCurriculumAudit(id), requests: (id) => [`GET /admin/curriculum/lessons/${id}/audit`] },
    { name: 'submitCurriculumReview', call: (id) => curriculumApi.submitCurriculumReview(id, id), requests: (id) => [`POST /admin/curriculum/lessons/${id}/drafts/${id}/submit-review`] },
    { name: 'approveCurriculumVersion', call: (id) => curriculumApi.approveCurriculumVersion(id, id), requests: (id) => [`POST /admin/curriculum/lessons/${id}/drafts/${id}/approve`] },
    { name: 'requestCurriculumChanges', call: (id) => curriculumApi.requestCurriculumChanges(any({ publicLessonId: id, versionId: id, note: 'n' })), requests: (id) => [`POST /admin/curriculum/lessons/${id}/drafts/${id}/request-changes`] },
    { name: 'publishCurriculumVersion', call: (id) => curriculumApi.publishCurriculumVersion(any({ publicLessonId: id, versionId: 'v' })), requests: (id) => [`POST /admin/curriculum/lessons/${id}/publish`] },
    { name: 'applyCurriculumMigration', call: (id) => curriculumApi.applyCurriculumMigration(any({ migrationId: id })), requests: (id) => [`POST /admin/curriculum/migrations/${id}/apply`] },
    { name: 'getCurriculumMigrationEvidence', call: (id) => curriculumApi.getCurriculumMigrationEvidence(id), requests: (id) => [`GET /admin/curriculum/migrations/${id}`] },
  ],
  billingApi: [
    { name: 'getCheckoutCommand', call: (id) => billingApi.getCheckoutCommand(id), requests: (id) => [`GET /parents/me/subscription/checkout/${id}`] },
    { name: 'recheckCheckoutCommand', call: (id) => billingApi.recheckCheckoutCommand(id), requests: (id) => [`POST /parents/me/subscription/checkout/${id}/recheck`] },
  ],
  chatApi: [
    { name: 'getConversation', call: (id) => chatApi.getConversation(id), requests: (id) => [`GET /conversations/${id}`] },
    { name: 'sendConversationMessage', call: (id) => chatApi.sendConversationMessage(id, any({ content: 'c' })), requests: (id) => [`POST /conversations/${id}/messages`] },
  ],
  chatStreamApi: [
    {
      name: 'streamConversationMessage',
      call: (id) =>
        chatStreamApi.streamConversationMessage({ conversationId: id, payload: { content: 'c', idempotencyKey: 'k' }, onEvent: () => {} }),
      requests: (id) => [`FETCH /conversations/${id}/messages/stream`],
    },
    { name: 'getGenerationProgress', call: (id) => chatStreamApi.getGenerationProgress(id), requests: (id) => [`GET /conversations/${id}/generation`] },
  ],
  fileApi: [
    {
      name: 'uploadFile',
      call: (id) => {
        currentId = id
        return fileApi.uploadFile({ file: new File(['x'], 'x.txt', { type: 'text/plain' }) })
      },
      requests: (id) => ['POST /files/intents', `PUT /files/${id}/chunks/1`, `POST /files/${id}/complete`],
    },
    { name: 'getUploadedFile', call: (id) => fileApi.getUploadedFile(id), requests: (id) => [`GET /files/attachments/${id}`] },
    { name: 'deleteUploadedFile', call: (id) => fileApi.deleteUploadedFile(id), requests: (id) => [`DELETE /files/attachments/${id}`] },
  ],
  learningOperationsApi: [
    { name: 'previewAssignmentAutomationBatch', call: (id) => learningOperationsApi.previewAssignmentAutomationBatch(id, any({})), requests: (id) => [`POST /adaptive/students/${id}/assignment-automation/batches/preview`] },
    { name: 'executeAssignmentAutomationBatch', call: (id) => learningOperationsApi.executeAssignmentAutomationBatch(id, any({})), requests: (id) => [`POST /adaptive/students/${id}/assignment-automation/batches/execute`] },
    { name: 'getStudentAssignments', call: (id) => learningOperationsApi.getStudentAssignments(id), requests: (id) => [`GET /adaptive/students/${id}/assignments`] },
    { name: 'getParentChildProgress', call: (id) => learningOperationsApi.getParentChildProgress(id), requests: (id) => [`GET /adaptive/parents/me/children/${id}/progress`] },
  ],
  learningProfileApi: [
    { name: 'getLearningProfile', call: (id) => learningProfileApi.getLearningProfile(id), requests: (id) => [`GET /students/${id}/learning-profile`] },
  ],
  notificationApi: [
    { name: 'markNotificationRead', call: (id) => notificationApi.markNotificationRead(id), requests: (id) => [`POST /notifications/${id}/read`] },
    { name: 'archiveNotification', call: (id) => notificationApi.archiveNotification(id), requests: (id) => [`POST /notifications/${id}/archive`] },
  ],
  parentApi: [
    { name: 'getChildLearningSummary', call: (id) => parentApi.getChildLearningSummary(id), requests: (id) => [`GET /parents/me/children/${id}/summary`] },
    { name: 'getChildLearningHistory', call: (id) => parentApi.getChildLearningHistory(id), requests: (id) => [`GET /parents/me/children/${id}/history`] },
    { name: 'getChildLearningProfile', call: (id) => parentApi.getChildLearningProfile(id), requests: (id) => [`GET /parents/me/children/${id}/learning-profile`] },
  ],
  parentReportApi: [
    { name: 'getChildReport', call: (id) => parentReportApi.getChildReport(id), requests: (id) => [`GET /parents/me/children/${id}/report`] },
  ],
  practiceApi: [
    { name: 'getSubjectPath', call: (id) => practiceApi.getSubjectPath(id, id), requests: (id) => [`GET /practice/${id}/${id}/path`] },
    { name: 'getSubjectPath without a topic', call: (id) => practiceApi.getSubjectPath(id), requests: (id) => [`GET /practice/${id}/default/path`] },
    { name: 'getPracticeRoadmap', call: (id) => practiceApi.getPracticeRoadmap(id, id), requests: (id) => [`GET /practice/${id}/${id}/roadmap`] },
    { name: 'getPracticeLesson', call: (id) => practiceApi.getPracticeLesson(id), requests: (id) => [`GET /practice/lessons/${id}`] },
    { name: 'submitChallengeAnswer', call: (id) => practiceApi.submitChallengeAnswer(id, any({})), requests: (id) => [`POST /practice/challenges/${id}/answer`] },
    { name: 'startLessonQuiz', call: (id) => practiceApi.startLessonQuiz(id, 'skip'), requests: (id) => [`POST /practice/lessons/${id}/quiz`] },
    { name: 'answerLessonQuiz', call: (id) => practiceApi.answerLessonQuiz(id, id, any({})), requests: (id) => [`POST /practice/lessons/${id}/quiz/${id}/answer`] },
    { name: 'completePracticeLesson', call: (id) => practiceApi.completePracticeLesson(id), requests: (id) => [`POST /practice/lessons/${id}/complete`] },
  ],
  teacherApi: [
    { name: 'getTeacherHelpRequestDetail', call: (id) => teacherApi.getTeacherHelpRequestDetail(id), requests: (id) => [`GET /teachers/me/help-requests/${id}`] },
    { name: 'updateTeacherHelpRequestStatus', call: (id) => teacherApi.updateTeacherHelpRequestStatus(any({ requestId: id, status: 'resolved' })), requests: (id) => [`PATCH /teachers/me/help-requests/${id}`] },
    { name: 'addTeacherHelpRequestNote', call: (id) => teacherApi.addTeacherHelpRequestNote(any({ requestId: id, content: 'c' })), requests: (id) => [`POST /teachers/me/help-requests/${id}/notes`] },
    { name: 'getTeacherAssistanceSummary', call: (id) => teacherApi.getTeacherAssistanceSummary(id), requests: (id) => [`GET /teachers/questions/${id}/assistance-summary`] },
    { name: 'createAiTeacherSummaryDraft', call: (id) => teacherApi.createAiTeacherSummaryDraft(id), requests: (id) => [`POST /teachers/questions/${id}/ai-tools/summary-draft`] },
    { name: 'regenerateAiTeacherDraft', call: (id) => teacherApi.regenerateAiTeacherDraft(id), requests: (id) => [`POST /teachers/ai-tools/drafts/${id}/regenerate`] },
    { name: 'acceptAiTeacherDraft', call: (id) => teacherApi.acceptAiTeacherDraft(any({ draftId: id })), requests: (id) => [`POST /teachers/ai-tools/drafts/${id}/accept`] },
  ],
  teacherApplicationApi: [
    { name: 'getTeacherApplicationDetail', call: (id) => teacherApplicationApi.getTeacherApplicationDetail(id, 2), requests: (id) => [`GET /teacher-applications/${id}/versions/2`] },
    { name: 'reviewTeacherApplication', call: (id) => teacherApplicationApi.reviewTeacherApplication(any({ applicationId: id })), requests: (id) => [`POST /teacher-applications/${id}/reviews`] },
    { name: 'reissueTeacherInvitation', call: (id) => teacherApplicationApi.reissueTeacherInvitation(id, 2), requests: (id) => [`POST /teacher-applications/${id}/invitations`] },
  ],
  teacherHelpApi: [
    { name: 'getTeacherHelpRequest', call: (id) => teacherHelpApi.getTeacherHelpRequest(id), requests: (id) => [`GET /teacher-help/conversations/${id}/request`] },
  ],
}

async function requestsMadeBy(testCase: Case, id: string) {
  seen.length = 0
  currentId = id
  // Some calls reject on the empty answer; only the request they made matters.
  await testCase.call(id).catch(() => undefined)
  return [...seen]
}

describe.each(Object.entries(cases))('%s', (_file, fileCases) => {
  it.each(fileCases.map((testCase) => [testCase.name, testCase] as const))(
    '%s keeps a plain id path exactly as it was',
    async (_name, testCase) => {
      expect(await requestsMadeBy(testCase, PLAIN)).toEqual(testCase.requests(PLAIN))
    },
  )

  it.each(fileCases.map((testCase) => [testCase.name, testCase] as const))(
    '%s keeps an id holding /, ? and # inside its own segment',
    async (_name, testCase) => {
      const requests = await requestsMadeBy(testCase, HOSTILE)
      expect(requests).toEqual(testCase.requests(HOSTILE_SEGMENT))
      for (const request of requests) expect(request).not.toMatch(/[?#]/)
    },
  )
})

describe('apiPath', () => {
  it('encodes each value once and leaves the literal text alone', () => {
    expect(apiPath`/a/${'x/y'}/b/${3}`).toBe('/a/x%2Fy/b/3')
    // An already encoded value is encoded again: callers pass raw values.
    expect(apiPath`/a/${'x%2Fy'}`).toBe('/a/x%252Fy')
  })

  it('gives the bare text when nothing is inserted', () => {
    expect(apiPath`/a/b`).toBe('/a/b')
  })
})
