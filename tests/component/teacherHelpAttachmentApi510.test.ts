/**
 * #510: the teacher's read of a picture in a help request, at the service.
 *
 * The route wants the teacher's token, so the page cannot hand its address
 * to an `<img>`: the service reads the bytes as a Blob for the page to give
 * an object URL. Read as JSON or text (axios' default), `createObjectURL`
 * throws and takes the request card down with it.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/services/api/httpClient'
import { getTeacherHelpRequestAttachment } from '@/services/teacher/teacherApi'
import { mswServer } from '../mswServer'

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  mswServer.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => mswServer.close())

// The first bytes of a PNG: not text, and not JSON.
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff])

function served() {
  const seen: string[] = []
  mswServer.use(
    http.get('https://api.test/teachers/me/help-requests/:requestId/attachments/:attachmentId/content', ({ request }) => {
      seen.push(new URL(request.url).pathname)
      return new HttpResponse(PNG, { headers: { 'Content-Type': 'image/png' } })
    }),
  )
  return seen
}

describe('the teacher reads a picture in a help request', () => {
  it('asks axios for a Blob', async () => {
    served()
    const get = vi.spyOn(httpClient, 'get')
    await getTeacherHelpRequestAttachment('r1', 'att-1')
    expect(get).toHaveBeenCalledWith(
      '/teachers/me/help-requests/r1/attachments/att-1/content',
      expect.objectContaining({ responseType: 'blob' }),
    )
  })

  // Under jsdom axios' adapter decodes the body as text before it makes the
  // Blob, so the bytes themselves are not compared here; a browser's XHR
  // keeps them. That it is a Blob, with the server's type, is.
  it('hands the page a Blob with the type the server sent', async () => {
    served()
    const blob = await getTeacherHelpRequestAttachment('r1', 'att-1')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })

  it('at the route of this request and this file, each id one path segment', async () => {
    const seen = served()
    await getTeacherHelpRequestAttachment('r/1', 'a?b#c')
    expect(seen).toEqual(['/teachers/me/help-requests/r%2F1/attachments/a%3Fb%23c/content'])
  })
})
