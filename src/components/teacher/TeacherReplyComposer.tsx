import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Code2, List, Pilcrow, Send, Sigma, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RichTeacherReply } from '@/components/teacher/RichTeacherReply'
import { Button } from '@/components/ui/button'
import type { TeacherReplyBlock, TeacherReplyRichContent } from '@/types/teacher'

type ComposerMode = TeacherReplyBlock['type']

const modeOptions: { mode: ComposerMode; Icon: typeof Pilcrow }[] = [
  { mode: 'paragraph', Icon: Pilcrow },
  { mode: 'formula', Icon: Sigma },
  { mode: 'unordered_list', Icon: List },
  { mode: 'code', Icon: Code2 },
]

type ComposerDraft = { mode: ComposerMode; value: string; blocks: TeacherReplyBlock[] }

const emptyDraft: ComposerDraft = { mode: 'paragraph', value: '', blocks: [] }

/*
 * The draft outlives the composer: the page takes it away while a request
 * cannot be acted on, and a teacher may leave and come back (#331). Kept per
 * request for this tab only; storage that throws (private mode) just keeps
 * nothing.
 */
const draftStorageKey = (draftKey: string) => `stoa.teacherReplyDraft.${draftKey}`

function readDraft(draftKey: string | undefined): ComposerDraft {
  if (!draftKey) return emptyDraft
  try {
    const stored = JSON.parse(sessionStorage.getItem(draftStorageKey(draftKey)) ?? 'null') as Partial<ComposerDraft> | null
    if (!stored || typeof stored.value !== 'string' || !Array.isArray(stored.blocks)) return emptyDraft
    const mode = modeOptions.some((option) => option.mode === stored.mode) ? (stored.mode as ComposerMode) : 'paragraph'
    return { mode, value: stored.value, blocks: stored.blocks }
  } catch {
    return emptyDraft
  }
}

function writeDraft(draftKey: string | undefined, draft: ComposerDraft) {
  if (!draftKey) return
  try {
    if (!draft.value && draft.blocks.length === 0) sessionStorage.removeItem(draftStorageKey(draftKey))
    else sessionStorage.setItem(draftStorageKey(draftKey), JSON.stringify(draft))
  } catch {
    // Nothing kept; the draft still lives on screen.
  }
}

export function TeacherReplyComposer({
  isSubmitting,
  onSubmit,
  disabled = false,
  draftKey,
}: {
  isSubmitting: boolean
  onSubmit: (content: string, richContent: TeacherReplyRichContent, onSuccess: () => void) => void
  /** Keeps the draft on screen but takes nothing in or out. */
  disabled?: boolean
  /** Keeps the draft in this tab's storage under this key, usually the request id. */
  draftKey?: string
}) {
  const { t } = useTranslation('teacher')
  const [initialDraft] = useState(() => readDraft(draftKey))
  const [mode, setMode] = useState<ComposerMode>(initialDraft.mode)
  const [value, setValue] = useState(initialDraft.value)
  const [blocks, setBlocks] = useState<TeacherReplyBlock[]>(initialDraft.blocks)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wasSubmitting = useRef(isSubmitting)

  useEffect(() => {
    writeDraft(draftKey, { mode, value, blocks })
  }, [draftKey, mode, value, blocks])

  // The send button is disabled while the reply is on its way, which drops
  // keyboard focus on the page; give it back to the reply once it lands (#332).
  useEffect(() => {
    const active = document.activeElement as (HTMLElement & { disabled?: boolean }) | null
    const lost = !active || active === document.body || active.disabled || !active.isConnected
    if (wasSubmitting.current && !isSubmitting && lost) textareaRef.current?.focus()
    wasSubmitting.current = isSubmitting
  }, [isSubmitting])

  const previewBlocks = useMemo(() => {
    const trimmed = value.trim()
    return trimmed ? [...blocks, blockFromInput(mode, trimmed)] : blocks
  }, [blocks, mode, value])
  const problem = useMemo(() => replyProblem(previewBlocks), [previewBlocks])
  const locked = isSubmitting || disabled
  const canSubmit = previewBlocks.length > 0 && !locked && !problem

  function addBlock() {
    const trimmed = value.trim()
    if (!trimmed || replyProblem([...blocks, blockFromInput(mode, trimmed)])) return
    setBlocks((current) => [...current, blockFromInput(mode, trimmed)])
    setValue('')
    textareaRef.current?.focus()
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, at) => at !== index))
    textareaRef.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    const richContent: TeacherReplyRichContent = { version: 1, blocks: previewBlocks }
    onSubmit(plainTextFallback(richContent), richContent, () => {
      setBlocks([])
      setValue('')
      setMode('paragraph')
      textareaRef.current?.focus()
    })
  }

  return (
    <form className="space-y-3 rounded-md border bg-card p-4" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        {modeOptions.map((option) => {
          const Icon = option.Icon
          const active = mode === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              title={t(`reply.modes.${option.mode}`)}
              aria-label={t(`reply.modes.${option.mode}`)}
              aria-pressed={active}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'
              }`}
              disabled={disabled}
              onClick={() => setMode(option.mode)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      {blocks.length > 0 && (
        <div className="space-y-2 rounded-md border bg-secondary/40 p-3">
          <p id="teacher-reply-queued" className="text-xs text-muted-foreground">
            {t('reply.queued', { count: blocks.length })}
          </p>
          {/* What is queued is what will be sent: shown as the student sees it,
              and each block can be taken out again (#332). */}
          <ol aria-labelledby="teacher-reply-queued" className="space-y-2">
            {blocks.map((block, index) => (
              <li key={index} className="flex items-start justify-between gap-2 rounded-md bg-background p-2">
                <div className="min-w-0 flex-1">
                  <RichTeacherReply content={{ version: 1, blocks: [block] }} fallback="" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t('reply.removeBlock', { number: index + 1 })}
                  disabled={locked}
                  onClick={() => removeBlock(index)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <label className="block text-sm font-medium" htmlFor="teacher-rich-reply">
        {t('reply.label')}
      </label>
      {/* Read-only, not disabled, while sending: a disabled field drops the
          keyboard focus (#332). Disabled only while the page cannot act (#331). */}
      <textarea
        ref={textareaRef}
        id="teacher-rich-reply"
        className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 placeholder:text-muted-foreground"
        placeholder={mode === 'formula' ? '2x + 4 = 10' : t('reply.placeholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        readOnly={isSubmitting}
        disabled={disabled}
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? 'teacher-reply-problem' : undefined}
      />
      {problem && (
        <p id="teacher-reply-problem" className="text-sm text-destructive">
          {t(`reply.unsafe.${problem.key}`, problem.values)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={addBlock}
          disabled={locked || !value.trim() || Boolean(problem)}
        >
          {t('reply.addBlock')}
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('reply.send')}
        </Button>
      </div>
    </form>
  )
}

function blockFromInput(mode: ComposerMode, value: string): TeacherReplyBlock {
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

/*
 * What stoa-backend's teacher_reply_service refuses with a 422 (#332): at most
 * 20 blocks, 2000 characters in a text block, 500 in a formula, 4000 in all
 * (the blocks joined by line breaks). Python counts code points, so do we.
 */
const REPLY_LIMITS = { blocks: 20, textBlock: 2000, formula: 500, total: 4000 } as const

type ReplyProblem = {
  key: 'html' | 'privateMarkers' | 'blockTooLong' | 'tooManyBlocks' | 'tooLong'
  values?: Record<string, number>
}

const characters = (text: string) => [...text].length

/** Why a reply may not be sent, as the key of its message; null when it may. */
function replyProblem(blocks: TeacherReplyBlock[]): ReplyProblem | null {
  const unsafe = unsafeReplyReason(blocks)
  if (unsafe) return { key: unsafe }
  for (const block of blocks) {
    const max = block.type === 'formula' ? REPLY_LIMITS.formula : REPLY_LIMITS.textBlock
    const length = characters(block.type === 'formula' ? block.latex : block.text)
    if (length > max) return { key: 'blockTooLong', values: { length, max } }
  }
  if (blocks.length > REPLY_LIMITS.blocks) return { key: 'tooManyBlocks', values: { max: REPLY_LIMITS.blocks } }
  const length = characters(plainTextFallback({ version: 1, blocks }))
  if (length > REPLY_LIMITS.total) return { key: 'tooLong', values: { length, max: REPLY_LIMITS.total } }
  return null
}

function plainTextFallback(content: TeacherReplyRichContent) {
  return content.blocks
    .map((block) => (block.type === 'formula' ? block.latex : block.text))
    .join('\n')
    .trim()
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
