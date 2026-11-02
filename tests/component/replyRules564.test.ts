/**
 * #564: what a teacher's reply may be, and why one was not taken, in one
 * vocabulary. The check before sending (`replyProblem`) and the reading of
 * the server's refusal after (`classifyRefusal`) name the same reasons.
 */
import { describe, expect, it } from 'vitest'
import {
  classifyRefusal,
  refusalFromMessage,
  REPLY_LIMITS,
  replyProblem,
  type ReplyRefusal,
} from '@/features/teacherReply/replyRules'
import { ApiError } from '@/services/api/httpClient'
import type { TeacherReplyBlock } from '@/types/teacher'

const paragraph = (text: string): TeacherReplyBlock => ({ type: 'paragraph', text })
const refused = (message: string, code?: string) => new ApiError(message, { status: 422, code })

describe('the check before sending', () => {
  it('refuses HTML', () => {
    expect(replyProblem([paragraph('<script>alert(1)</script>')])).toEqual({ reason: 'html' })
  })

  it('refuses the server\'s private markers', () => {
    expect(replyProblem([paragraph('Siehe s3://bucket/datei')])).toEqual({ reason: 'privateMarkers' })
  })

  it('refuses a block over its limit', () => {
    expect(replyProblem([{ type: 'formula', latex: 'x'.repeat(REPLY_LIMITS.formula + 1) }])).toEqual({
      reason: 'blockTooLong',
      values: { length: 501, max: 500 },
    })
  })

  it('refuses more blocks than the server takes', () => {
    const blocks = Array.from({ length: REPLY_LIMITS.blocks + 1 }, (_, index) => paragraph(`Schritt ${index}`))
    expect(replyProblem(blocks)).toEqual({ reason: 'tooManyBlocks', values: { max: 20 } })
  })

  it('refuses a reply over 4000 characters in all, the line break between blocks counted', () => {
    expect(replyProblem([paragraph('a'.repeat(2000)), paragraph('b'.repeat(2000))])).toEqual({
      reason: 'tooLong',
      values: { length: 4001, max: 4000 },
    })
  })

  it('lets maths through (#268)', () => {
    expect(replyProblem([paragraph('0 < a < 1 und set one = 1')])).toBeNull()
    expect(replyProblem([{ type: 'formula', latex: '0<a<1' }])).toBeNull()
  })
})

describe('the refusal after sending', () => {
  it('is read by its code', () => {
    expect(classifyRefusal(new ApiError('gone', { status: 404, code: 'upload_not_found' }))).toBe('images')
    expect(classifyRefusal(refused('expired', 'upload_expired'))).toBe('images')
    expect(classifyRefusal(new ApiError('changed', { status: 409, code: 'help_request_changed' }))).toBe('conflict')
  })

  it('is read by its sentence while the server sends no code for it (#388)', () => {
    expect(classifyRefusal(refused('text exceeds 2000 characters'))).toBe('blockTooLong')
    // A code not registered falls back to the sentence.
    expect(classifyRefusal(refused('teacher reply fallback exceeds 4000 characters', 'teacher_reply_block_too_long'))).toBe(
      'tooLong',
    )
    expect(refusalFromMessage('teacher reply contains unsafe raw HTML')).toBe('html')
  })

  it('is unknown for a 422 it cannot read, and no refusal at all for anything else', () => {
    expect(classifyRefusal(refused('something else'))).toBe('unknown')
    expect(classifyRefusal(new ApiError('boom', { status: 500 }))).toBeNull()
    expect(classifyRefusal(new Error('offline'))).toBeNull()
  })
})

describe('one vocabulary', () => {
  it.each([
    [[paragraph('<a href="x">hier</a>')], 'teacher reply contains unsafe raw HTML'],
    [[paragraph('password=geheim')], 'teacher reply contains private credentials'],
    [[paragraph('a'.repeat(2001))], 'text exceeds 2000 characters'],
    [Array.from({ length: 21 }, () => paragraph('x')), 'rich_content blocks must contain 1 to 20 blocks'],
    [[paragraph('a'.repeat(2000)), paragraph('a'.repeat(2000))], 'teacher reply fallback exceeds 4000 characters'],
  ] as const)('names a reply the same before and after: %#', (blocks, sentence) => {
    const before: ReplyRefusal | undefined = replyProblem([...blocks])?.reason
    const after: ReplyRefusal | null = classifyRefusal(refused(sentence))
    expect(before).toBeDefined()
    expect(after).toBe(before)
  })
})
