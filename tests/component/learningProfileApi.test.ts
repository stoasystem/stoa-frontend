/**
 * The student id in a learning profile request is one path segment, whatever
 * the address carried: the router decodes `x%252F..` to `x/..`, which
 * unencoded would walk the request to another API path (#91 audit).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/services/api/httpClient'
import { getLearningProfile } from '@/services/learning/learningProfileApi'

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)

describe('getLearningProfile', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: {} } as never)
  })

  it('asks for the profile of the student it was given', async () => {
    await getLearningProfile('s-1')
    expect(mockedGet).toHaveBeenCalledWith('/students/s-1/learning-profile')
  })

  it('keeps a decoded id with slashes and dot segments inside its own segment', async () => {
    await getLearningProfile('x/../../admin')
    expect(mockedGet).toHaveBeenCalledWith('/students/x%2F..%2F..%2Fadmin/learning-profile')
  })
})
