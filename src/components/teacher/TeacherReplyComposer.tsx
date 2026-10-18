import { FormEvent, useMemo, useState } from 'react'
import { Code2, List, Pilcrow, Send, Sigma } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { TeacherReplyBlock, TeacherReplyRichContent } from '@/types/teacher'

type ComposerMode = TeacherReplyBlock['type']

const modeOptions: { mode: ComposerMode; Icon: typeof Pilcrow }[] = [
  { mode: 'paragraph', Icon: Pilcrow },
  { mode: 'formula', Icon: Sigma },
  { mode: 'unordered_list', Icon: List },
  { mode: 'code', Icon: Code2 },
]

export function TeacherReplyComposer({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean
  onSubmit: (content: string, richContent: TeacherReplyRichContent, onSuccess: () => void) => void
}) {
  const { t } = useTranslation('teacher')
  const [mode, setMode] = useState<ComposerMode>('paragraph')
  const [value, setValue] = useState('')
  const [blocks, setBlocks] = useState<TeacherReplyBlock[]>([])

  const previewBlocks = useMemo(() => {
    const trimmed = value.trim()
    return trimmed ? [...blocks, blockFromInput(mode, trimmed)] : blocks
  }, [blocks, mode, value])
  const unsafeReason = useMemo(() => unsafeReplyReason(previewBlocks), [previewBlocks])
  const canSubmit = previewBlocks.length > 0 && !isSubmitting && !unsafeReason

  function addBlock() {
    const trimmed = value.trim()
    if (!trimmed || unsafeReplyReason([blockFromInput(mode, trimmed)])) return
    setBlocks((current) => [...current, blockFromInput(mode, trimmed)])
    setValue('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    const richContent: TeacherReplyRichContent = { version: 1, blocks: previewBlocks }
    onSubmit(plainTextFallback(richContent), richContent, () => {
      setBlocks([])
      setValue('')
      setMode('paragraph')
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
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'
              }`}
              onClick={() => setMode(option.mode)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <label className="block text-sm font-medium" htmlFor="teacher-rich-reply">
        {t('reply.label')}
      </label>
      <textarea
        id="teacher-rich-reply"
        className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 placeholder:text-muted-foreground"
        placeholder={mode === 'formula' ? '2x + 4 = 10' : t('reply.placeholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={isSubmitting}
      />
      {blocks.length > 0 && (
        <div className="rounded-md border bg-secondary/40 p-3 text-xs text-muted-foreground">
          {t('reply.queued', { count: blocks.length })}
        </div>
      )}
      {unsafeReason && <p className="text-sm text-destructive">{t(`reply.unsafe.${unsafeReason}`)}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={addBlock}
          disabled={isSubmitting || !value.trim() || Boolean(unsafeReason)}
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
  return { type: mode, text: value }
}

function plainTextFallback(content: TeacherReplyRichContent) {
  return content.blocks
    .map((block) => (block.type === 'formula' ? block.latex : block.text))
    .join('\n')
    .trim()
}

/** Why a reply may not be sent, as the key of its message; null when it may. */
function unsafeReplyReason(blocks: TeacherReplyBlock[]): 'html' | 'privateMarkers' | null {
  const serialized = blocks
    .map((block) => (block.type === 'formula' ? block.latex : block.text))
    .join('\n')
    .toLowerCase()
  if (!serialized) return null
  if (looksLikeUnsafeHtml(serialized)) return 'html'
  const privateMarkers = [
    'private/',
    'weekly-reports/',
    'presigned_url',
    'presignedurl',
    'x-amz-signature',
    'access_token',
    'id_token',
    'refresh_token',
    'aws_secret_access_key',
  ]
  return privateMarkers.some((marker) => serialized.includes(marker))
    ? 'privateMarkers'
    : null
}

/*
 * Only what a browser would read as a tag counts: "<" straight before the tag
 * name (#268). "0 < a < 1", "0<a<1" and "set one = 1" are maths and plain
 * text, not HTML. Replies are rendered as text nodes, so this guards against
 * pasted markup; it is not the escaping itself.
 */
const UNSAFE_TAG =
  /<\/?(script|iframe|frame|frameset|embed|object|applet|style|link|meta|base|html|body|img|svg|math|video|audio|form|input|button|a)(?=[\s/>]|$)/

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
