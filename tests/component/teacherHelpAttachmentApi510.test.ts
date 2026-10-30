/**
 * #510: the teacher's read of a picture in a help request, at the service.
 *
 * The route wants the teacher's token, so the page cannot hand its address
 * to an `<img>`: the service reads the bytes as a Blob for the page to give
 * an object URL. Read as JSON or text (axios' default), `createObjectURL`
 * throws and takes the request card down with it.
 *
 * Not through msw: its XHR interceptor builds an undici `Response` from
 * jsdom's Blob, which on Node 22 (CI) has no `stream()`; the read then never
 * settles. What is pinned is what the service asks axios for.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/services/api/httpClient'
import { getTeacherHelpRequestAttachment } from '@/services/teacher/teacherApi'

afterEach(() => {
  vi.restoreAllMocks()
})

function answered(blob = new Blob(['png'], { type: 'image/png' })) {
  return vi.spyOn(httpClient, 'get').mockResolvedValue({ data: blob })
}

describe('the teacher reads a picture in a help request', () => {
  it('asks axios for a Blob, and hands the page what came back', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })
    const get = answered(blob)

    expect(await getTeacherHelpRequestAttachment('r1', 'att-1')).toBe(blob)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith(
      '/teachers/me/help-requests/r1/attachments/att-1/content',
      expect.objectContaining({ responseType: 'blob' }),
    )
  })

  it('at the route of this request and this file, each id one path segment', async () => {
    const get = answered()
    await getTeacherHelpRequestAttachment('r/1', 'a?b#c')
    expect(get.mock.calls[0]?.[0]).toBe('/teachers/me/help-requests/r%2F1/attachments/a%3Fb%23c/content')
  })
})
