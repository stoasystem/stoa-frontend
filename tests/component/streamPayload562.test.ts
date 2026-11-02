/**
 * The body a pending message goes out with is put together in one place
 * (#562): the fields it carries, and no key at all for what it does not.
 */
import { describe, expect, it } from 'vitest'
import { toStreamPayload, type PendingMessage } from '@/lib/pendingChatMessages'

const practiceContext = { unitId: 'u', lessonId: 'l', challengeId: 'ch-1' }
const quote = { text: '2x + 3 = 7', source: { kind: 'challenge' as const, id: 'ch-1' } }

describe('toStreamPayload', () => {
  it('carries the command and its fields, and leaves out what the message has not', () => {
    const pending: PendingMessage = {
      idempotencyKey: 'held-c1',
      content: 'Why subtract 3 first?',
      askedAt: '2026-11-02T10:00:00Z',
      attachmentIds: [{ uploadId: 'up-1' }],
      attachments: [{ id: 'up-1', fileName: 'a.png', mimeType: 'image/png', size: 1 } as never],
      practiceContext,
      quote,
      unconfirmed: true,
    }
    expect(toStreamPayload(pending)).toEqual({
      content: 'Why subtract 3 first?',
      attachmentIds: [{ uploadId: 'up-1' }],
      idempotencyKey: 'held-c1',
      practiceContext,
      quote,
    })

    const bare = toStreamPayload({ idempotencyKey: 'initial-c1', content: 'Hi', askedAt: '2026-11-02T10:00:00Z' })
    expect(bare).not.toHaveProperty('practiceContext')
    expect(bare).not.toHaveProperty('quote')
    expect(bare).not.toHaveProperty('attachments')
    expect(bare).not.toHaveProperty('askedAt')
    expect(bare).not.toHaveProperty('unconfirmed')
    expect(JSON.parse(JSON.stringify(bare))).toEqual({ content: 'Hi', idempotencyKey: 'initial-c1' })
  })
})
