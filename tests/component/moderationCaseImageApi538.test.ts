/**
 * #538: the admin's read of the image an `image_upload` case refused, at the
 * service.
 *
 * The route wants the admin's token, so the page cannot hand its address to an
 * `<img>`: the service reads the bytes as a Blob for the page to give an object
 * URL. Read as JSON or text (axios' default), `createObjectURL` throws.
 *
 * Not through msw, for the reason in teacherHelpAttachmentApi510: what is
 * pinned is what the service asks axios for.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getModerationCaseImage } from '@/services/admin/adminApi'
import { httpClient } from '@/services/api/httpClient'

afterEach(() => {
  vi.restoreAllMocks()
})

function answered(blob = new Blob(['jpg'], { type: 'image/jpeg' })) {
  return vi.spyOn(httpClient, 'get').mockResolvedValue({ data: blob })
}

describe('the admin reads a blocked image', () => {
  it('asks axios for a Blob, and hands the page what came back', async () => {
    const blob = new Blob(['jpg'], { type: 'image/jpeg' })
    const get = answered(blob)

    expect(await getModerationCaseImage('mod-upload-1')).toBe(blob)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith(
      '/admin/moderation/cases/mod-upload-1/image',
      expect.objectContaining({ responseType: 'blob' }),
    )
  })

  it('at the route of this case, its id one path segment', async () => {
    const get = answered()
    await getModerationCaseImage('a/b?c#d')
    expect(get.mock.calls[0]?.[0]).toBe('/admin/moderation/cases/a%2Fb%3Fc%23d/image')
  })
})
