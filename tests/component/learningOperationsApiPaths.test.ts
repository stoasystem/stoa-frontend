/**
 * The student id in an assignment request is one path segment, whatever the
 * operator typed into the automation console: unencoded, a `/`, `?` or `#`
 * would walk the request to another API path (review of #246, 18 Oct 2026).
 * The same rule as the learning profile (learningProfileApi.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/services/api/httpClient'
import {
  executeAssignmentAutomationBatch,
  getStudentAssignments,
  previewAssignmentAutomationBatch,
} from '@/services/learning/learningOperationsApi'
import type { AutomationExecuteRequest, AutomationPreviewRequest } from '@/services/learning/learningOperationsApi'

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)
const mockedPost = vi.mocked(httpClient.post)
const awkward = 'x/../../admin?y=1#z'
const encoded = 'x%2F..%2F..%2Fadmin%3Fy%3D1%23z'

describe('the assignment automation paths', () => {
  beforeEach(() => {
    mockedGet.mockReset().mockResolvedValue({ data: {} } as never)
    mockedPost.mockReset().mockResolvedValue({ data: {} } as never)
  })

  it('keep a plain id as it is', async () => {
    await getStudentAssignments('student-123')
    expect(mockedGet.mock.calls[0][0]).toBe('/adaptive/students/student-123/assignments')
  })

  it('keep the history request inside the student segment', async () => {
    await getStudentAssignments(awkward)
    expect(mockedGet.mock.calls[0][0]).toBe(`/adaptive/students/${encoded}/assignments`)
  })

  it('keep the preview and execute requests inside the student segment', async () => {
    await previewAssignmentAutomationBatch(awkward, {} as AutomationPreviewRequest)
    await executeAssignmentAutomationBatch(awkward, {} as AutomationExecuteRequest)
    expect(mockedPost.mock.calls.map(([url]) => url)).toEqual([
      `/adaptive/students/${encoded}/assignment-automation/batches/preview`,
      `/adaptive/students/${encoded}/assignment-automation/batches/execute`,
    ])
  })
})
