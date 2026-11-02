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

describe('the limits, as the server counts them (#332)', () => {
  it.each([
    ['a text block of 2000 characters', [paragraph('a'.repeat(2000))], null],
    ['a formula of 500 characters', [{ type: 'formula', latex: 'x'.repeat(500) } as const], null],
    ['one character per emoji', [paragraph('😀'.repeat(2000))], null],
    ['20 blocks', Array.from({ length: 20 }, (_, index) => paragraph(`Schritt ${index + 1}`)), null],
    ['3999 characters and a line break', [paragraph('a'.repeat(2000)), paragraph('b'.repeat(1999))], null],
  ])('takes %s', (_, blocks, expected) => {
    expect(replyProblem([...blocks])).toBe(expected)
  })

  it.each([
    ['an S3 address', 'Siehe s3://bucket/datei'],
    ['an amazonaws link', 'https://bucket.amazonaws.com/x'],
    ['a password', 'password=geheim'],
    ['a cookie', 'cookie=abc'],
    ['a secret key name', 'SecretAccessKey: x'],
    ['an AWS access key', 'Schlüssel AKIAABCDEFGHIJKLMNOP hier'],
  ])('refuses %s, as the server does', (_, text) => {
    expect(replyProblem([paragraph(text)])?.reason).toBe('privateMarkers')
  })

  it('lets a lower-case lookalike of an access key through, as the server does', () => {
    expect(replyProblem([paragraph('akiaabcdefghijklmnop')])).toBeNull()
  })
})

describe('only what a browser reads as a tag is HTML (#268)', () => {
  it.each([
    ['an inequality', '0 < a < 1', 'paragraph'],
    ['an inequality without spaces', '0<a<1', 'paragraph'],
    ['"<a" before a word (#283–#311 review)', 'Für 0<a und a<1 gilt das', 'paragraph'],
    ['"<a" at the end', 'Dann ist b<a', 'paragraph'],
    ['"<a" at the end of a line', 'Es gilt x<a\nund 0<y', 'paragraph'],
    ['a chain of comparisons', 'a<b>c und x <= y', 'paragraph'],
    ['"one =" in a sentence', 'Set one = 1 first, once = 2 after', 'paragraph'],
    ['an inequality in a formula block', '0 < a < 1', 'formula'],
    ['LaTeX with angle brackets', String.raw`\left< a, b \right> < \frac{1}{a}`, 'formula'],
    ['LaTeX with "one ="', String.raw`\text{one} = 1,\ 0 < a \leq 1`, 'formula'],
  ] as const)('lets %s through', (_, text, mode) => {
    const block: TeacherReplyBlock = mode === 'formula' ? { type: 'formula', latex: text } : paragraph(text)
    expect(replyProblem([block])).toBeNull()
  })

  it.each([
    ['a script tag', '<script>alert(1)</script>'],
    ['a script tag in capitals', 'Hallo <SCRIPT SRC=//x.ch/a.js></SCRIPT>'],
    ['an image with an error handler', '<img src=x onerror=alert(1)>'],
    ['a link', '<a href="https://example.com">hier</a>'],
    ['a link split across lines', '<a\nhref=javascript:alert(1)>x</a>'],
    ['a self-closing svg with a load handler', '<svg/onload=alert(1)>'],
    ['a handler on a tag not on the list', '<details open ontoggle=alert(1)>'],
    ['a handler behind a quoted ">"', '<div title=">" onclick=alert(1)>x</div>'],
  ])('refuses %s', (_, text) => {
    expect(replyProblem([paragraph(text)])).toEqual({ reason: 'html' })
  })

  it('checks a long reply without stalling', () => {
    const started = performance.now()
    // Not HTML; at 8000 characters it is over the block limit instead (#332).
    expect(replyProblem([paragraph(`<div ${'a=b/ c= '.repeat(1000)}x`)])?.reason).toBe('blockTooLong')
    expect(performance.now() - started).toBeLessThan(1000)
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

  it.each([
    ['teacher reply contains unsafe raw HTML', 'html'],
    ['teacher reply contains private markers', 'privateMarkers'],
    ['teacher reply contains private credentials', 'privateMarkers'],
    ['rich_content blocks must contain 1 to 20 blocks', 'tooManyBlocks'],
    ['text exceeds 2000 characters', 'blockTooLong'],
    ['latex exceeds 500 characters', 'blockTooLong'],
    ['teacher reply fallback exceeds 4000 characters', 'tooLong'],
    ['content exceeds 4000 characters', 'tooLong'],
  ])('reads "%s"', (sentence, reason) => {
    expect(classifyRefusal(refused(sentence))).toBe(reason)
  })

  // #388: stoa-backend sends no code for a refused reply, so the codes #371
  // guessed say nothing; the message still decides.
  it.each([
    'teacher_reply_unsafe_html',
    'teacher_reply_private_markers',
    'teacher_reply_private_credentials',
    'teacher_reply_too_many_blocks',
    'teacher_reply_block_too_long',
    'teacher_reply_too_long',
    'constructor',
  ])('does not read the guessed code %s', (code) => {
    expect(classifyRefusal(refused('reworded by the server', code))).toBe('unknown')
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
