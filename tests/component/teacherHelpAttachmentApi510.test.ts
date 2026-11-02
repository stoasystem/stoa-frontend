/**
 * #510, #563: the two readers the attachment viewer reads a picture through,
 * down to what they ask axios for.
 *
 * Both routes want a token, so the page cannot hand their address to an
 * `<img>`: each reader reads the bytes as a Blob for the viewer to give an
 * object URL. Read as JSON or text (axios' default), `createObjectURL` throws
 * and takes the card down with it.
 *
 * Not through msw: its XHR interceptor builds an undici `Response` from
 * jsdom's Blob, which on Node 22 (CI) has no `stream()`; the read then never
 * settles. What is pinned is what the service asks axios for.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { studentAttachments, teacherHelpAttachments } from '@/features/attachments/attachmentReaders'
import { httpClient } from '@/services/api/httpClient'

afterEach(() => {
  vi.restoreAllMocks()
})

function answered(blob = new Blob(['png'], { type: 'image/png' })) {
  return vi.spyOn(httpClient, 'get').mockResolvedValue({ data: blob })
}

describe('the teacher reads a picture in a help request', () => {
  it('asks axios for a Blob, and hands the viewer what came back', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })
    const get = answered(blob)

    expect(await teacherHelpAttachments('r1').read('att-1')).toBe(blob)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith(
      '/teachers/me/help-requests/r1/attachments/att-1/content',
      expect.objectContaining({ responseType: 'blob' }),
    )
  })

  it('at the route of this request and this file, each id one path segment', async () => {
    const get = answered()
    await teacherHelpAttachments('r/1').read('a?b#c')
    expect(get.mock.calls[0]?.[0]).toBe('/teachers/me/help-requests/r%2F1/attachments/a%3Fb%23c/content')
  })

  it('keeps each request\'s files apart in the cache', () => {
    expect(teacherHelpAttachments('r1').scope).toEqual(['teacher-help', 'r1'])
    expect(teacherHelpAttachments('r2').scope).not.toEqual(teacherHelpAttachments('r1').scope)
  })
})

describe('the student reads a teacher\'s picture in a reply', () => {
  it('asks axios for a Blob from the student\'s own route, and hands the viewer what came back', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })
    const get = answered(blob)

    expect(await studentAttachments.read('att-1')).toBe(blob)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/files/attachments/att-1/content', expect.objectContaining({ responseType: 'blob' }))
  })

  it('with the id one path segment', async () => {
    const get = answered()
    await studentAttachments.read('a/b?c')
    expect(get.mock.calls[0]?.[0]).toBe('/files/attachments/a%2Fb%3Fc/content')
  })

  it('in its own scope, apart from a help request\'s', () => {
    expect(studentAttachments.scope).toEqual(['student'])
  })
})
