import { isUploadGone } from '@/features/uploads/uploadGone'
import { isHelpRequestConflict } from '@/lib/teacherHelpRequestConflict'
import { ApiError } from '@/services/api/httpClient'
import type { TeacherReplyBlock, TeacherReplyRichContent } from '@/types/teacher'

/**
 * What a teacher's reply may be, and why one was not taken (#564). No React:
 * the reply module checks a reply against these before it goes, and reads the
 * server's refusal into the same words after.
 */

/**
 * Why a reply cannot go, or did not: one vocabulary for the check before
 * sending and the refusal after.
 *
 * - `html` ... `tooLong`: what is in the reply. Checked here before sending,
 *   and what the server's 422 names (#332).
 * - `images`: a picture it carried was already sent, or past its time; the
 *   server took none of it (#513).
 * - `conflict`: the request moved on under the teacher (409, #269).
 * - `unknown`: refused (422) for a reason not read here.
 */
export type ReplyRefusal =
  | 'html'
  | 'privateMarkers'
  | 'blockTooLong'
  | 'tooManyBlocks'
  | 'tooLong'
  | 'images'
  | 'conflict'
  | 'unknown'

/** The refusals that lie in the reply's own content: the ones checked before it goes. */
export type ContentRefusal = Extract<ReplyRefusal, 'html' | 'privateMarkers' | 'blockTooLong' | 'tooManyBlocks' | 'tooLong'>

/** Why a reply may not be sent, with what its message names. */
export type ReplyProblem = { reason: ContentRefusal; values?: Record<string, number> }

/*
 * What stoa-backend's teacher_reply_service refuses with a 422 (#332): at most
 * 20 blocks, 2000 characters in a text block, 500 in a formula, 4000 in all
 * (the blocks joined by line breaks). Python counts code points, so do we.
 */
export const REPLY_LIMITS = { blocks: 20, textBlock: 2000, formula: 500, total: 4000 } as const

const characters = (text: string) => [...text].length

/** Why a reply may not be sent; null when it may. */
export function replyProblem(blocks: TeacherReplyBlock[]): ReplyProblem | null {
  const unsafe = unsafeReplyReason(blocks)
  if (unsafe) return { reason: unsafe }
  for (const block of blocks) {
    const max = block.type === 'formula' ? REPLY_LIMITS.formula : REPLY_LIMITS.textBlock
    const length = characters(block.type === 'formula' ? block.latex : block.text)
    if (length > max) return { reason: 'blockTooLong', values: { length, max } }
  }
  if (blocks.length > REPLY_LIMITS.blocks) return { reason: 'tooManyBlocks', values: { max: REPLY_LIMITS.blocks } }
  const length = characters(plainTextFallback({ version: 1, blocks }))
  if (length > REPLY_LIMITS.total) return { reason: 'tooLong', values: { length, max: REPLY_LIMITS.total } }
  return null
}

/** The reply as plain text, as the server keeps it beside the blocks. */
export function plainTextFallback(content: TeacherReplyRichContent) {
  return content.blocks
    .map((block) => (block.type === 'formula' ? block.latex : block.text))
    .join('\n')
    .trim()
}

/** The block the input makes in this mode, from the input already trimmed. */
export function blockFromInput(mode: TeacherReplyBlock['type'], value: string): TeacherReplyBlock {
  if (mode === 'formula') return { type: 'formula', latex: value }
  // One item per line; bullets or numbers the teacher typed are the list's own (#332).
  if (mode === 'unordered_list' || mode === 'ordered_list') {
    const items = value
      .split('\n')
      .map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, ''))
      .filter(Boolean)
    return { type: mode, text: items.join('\n') }
  }
  return { type: mode, text: value }
}

const textBlockTypes = new Set<string>(['paragraph', 'heading', 'ordered_list', 'unordered_list', 'quote', 'code'])

/*
 * A stored block as the composer would have queued it, or nothing. Storage
 * from an older version, or one edited by hand, may hold a block without its
 * text; rendered, that threw and took the whole request page down (#371).
 */
export function storedBlock(value: unknown): TeacherReplyBlock[] {
  if (typeof value !== 'object' || value === null) return []
  const { type, text, latex } = value as Record<string, unknown>
  if (type === 'formula') return typeof latex === 'string' && latex.trim() ? [{ type, latex }] : []
  if (typeof type !== 'string' || !textBlockTypes.has(type) || typeof text !== 'string' || !text.trim()) return []
  return [{ type: type as Exclude<TeacherReplyBlock['type'], 'formula'>, text }]
}

function unsafeReplyReason(blocks: TeacherReplyBlock[]): 'html' | 'privateMarkers' | null {
  const text = blocks
    .map((block) => (block.type === 'formula' ? block.latex : block.text))
    .join('\n')
  const serialized = text.toLowerCase()
  if (!serialized) return null
  if (looksLikeUnsafeHtml(serialized)) return 'html'
  // The backend's markers (_SECRET_MARKERS) and its AWS access key pattern (#332).
  const privateMarkers = [
    'weekly-reports/',
    'private/',
    's3://',
    'https://s3',
    'amazonaws.com',
    'x-amz-signature',
    'presignedurl',
    'presigned_url',
    'access_token',
    'id_token',
    'refresh_token',
    'aws_secret_access_key',
    'secretaccesskey',
    'password=',
    'cookie=',
  ]
  return privateMarkers.some((marker) => serialized.includes(marker)) || AWS_ACCESS_KEY.test(text)
    ? 'privateMarkers'
    : null
}

/*
 * Only what a browser would read as a whole tag counts: "<" straight before
 * the tag name, and the tag closed by ">" (#268). "0 < a < 1", "0<a<1",
 * "wenn 0<a und a<1" and "set one = 1" are maths and plain text, not HTML;
 * "<a href=...>" and "<script>" are markup. Replies are rendered as text nodes,
 * so this guards against pasted markup; it is not the escaping itself.
 */
const AWS_ACCESS_KEY = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/

const UNSAFE_TAG =
  /<\/?(script|iframe|frame|frameset|embed|object|applet|style|link|meta|base|html|body|img|svg|math|video|audio|form|input|button|a)(?:[\s/][^<>]*)?>/

function looksLikeUnsafeHtml(lowercased: string) {
  return UNSAFE_TAG.test(lowercased) || hasTagWithEventHandler(lowercased)
}

const isSpace = (char: string) => /\s/.test(char)

/*
 * An "on…=" handler on any tag. Walks each tag's attributes the way the HTML
 * tokenizer does, so a quoted ">" cannot hide a handler behind it. A scanner,
 * not a regex: walking attributes with a regex backtracks exponentially.
 */
function hasTagWithEventHandler(text: string) {
  let at = 0
  while ((at = text.indexOf('<', at)) !== -1) {
    at += 1
    if (!/[a-z]/.test(text[at] ?? '')) continue
    while (at < text.length && !isSpace(text[at]) && text[at] !== '/' && text[at] !== '>') at += 1
    while (at < text.length && text[at] !== '>') {
      if (isSpace(text[at]) || text[at] === '/') {
        at += 1
        continue
      }
      const nameStart = at
      at += 1 // a leading "=" belongs to the name
      while (at < text.length && !isSpace(text[at]) && !'/>='.includes(text[at])) at += 1
      const name = text.slice(nameStart, at)
      while (at < text.length && isSpace(text[at])) at += 1
      if (text[at] !== '=') continue
      if (/^on[a-z]+$/.test(name)) return true
      at += 1
      while (at < text.length && isSpace(text[at])) at += 1
      const quote = text[at]
      if (quote === '"' || quote === "'") {
        const close = text.indexOf(quote, at + 1)
        at = close === -1 ? text.length : close + 1
      } else {
        while (at < text.length && !isSpace(text[at]) && text[at] !== '>') at += 1
      }
    }
  }
  return false
}

/*
 * The server's code for a refused reply (stoa-backend#274, #573). The 422
 * body is {detail: {code, message, correlationId}}; the message is rendered
 * in the reader's language and is never read here. `teacher_reply_empty` and
 * `teacher_reply_malformed` have no reason of their own (the composer sends
 * neither an empty reply nor a malformed one) and read as `unknown`.
 */
const REFUSAL_CODES = new Map<string, ContentRefusal>([
  ['teacher_reply_unsafe_html', 'html'],
  ['teacher_reply_private_markers', 'privateMarkers'],
  ['teacher_reply_block_too_long', 'blockTooLong'],
  ['teacher_reply_too_many_blocks', 'tooManyBlocks'],
  ['teacher_reply_too_long', 'tooLong'],
])

/**
 * Why the server would not take a reply, in the words the check before
 * sending uses; null when it was not refused at all (a timeout, a 500), and
 * sending it again may pass.
 *
 * A refused picture is chosen again (#513); a 409 means the request moved on,
 * a 422 that the server refused the reply's content (#271), and its code says
 * what in it (#573).
 */
export function classifyRefusal(error: unknown): ReplyRefusal | null {
  if (isUploadGone(error)) return 'images'
  if (isHelpRequestConflict(error)) return 'conflict'
  if (!(error instanceof ApiError) || error.status !== 422) return null
  return (error.code ? REFUSAL_CODES.get(error.code) : undefined) ?? 'unknown'
}
