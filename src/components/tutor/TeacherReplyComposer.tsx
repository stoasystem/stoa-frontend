import { FormEvent, useMemo, useState } from 'react'
import { Code2, List, Pilcrow, Send, Sigma } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TeacherReplyBlock, TeacherReplyRichContent } from '@/types/tutor'

type ComposerMode = TeacherReplyBlock['type']

const modeOptions: { mode: ComposerMode; label: string; Icon: typeof Pilcrow }[] = [
  { mode: 'paragraph', label: 'Paragraph', Icon: Pilcrow },
  { mode: 'formula', label: 'Formula', Icon: Sigma },
  { mode: 'unordered_list', label: 'List', Icon: List },
  { mode: 'code', label: 'Code', Icon: Code2 },
]

export function TeacherReplyComposer({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean
  onSubmit: (content: string, richContent: TeacherReplyRichContent, onSuccess: () => void) => void
}) {
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
              title={option.label}
              aria-label={option.label}
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
        Teacher reply
      </label>
      <textarea
        id="teacher-rich-reply"
        className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={mode === 'formula' ? '2x + 4 = 10' : 'Write the next step for the student.'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={isSubmitting}
      />
      {blocks.length > 0 && (
        <div className="rounded-md border bg-secondary/40 p-3 text-xs text-muted-foreground">
          {blocks.length} block{blocks.length === 1 ? '' : 's'} queued
        </div>
      )}
      {unsafeReason && <p className="text-sm text-destructive">{unsafeReason}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={addBlock}
          disabled={isSubmitting || !value.trim() || Boolean(unsafeReason)}
        >
          Add Block
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          Send Reply
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

function unsafeReplyReason(blocks: TeacherReplyBlock[]) {
  const serialized = blocks
    .map((block) => (block.type === 'formula' ? block.latex : block.text))
    .join('\n')
    .toLowerCase()
  if (!serialized) return null
  if (/<\s*\/?\s*(script|iframe|embed|object|img|svg|a)\b/.test(serialized) || /\bon[a-z]+\s*=/.test(serialized)) {
    return 'Unsafe raw HTML is not allowed.'
  }
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
    ? 'Private markers cannot be sent in a teacher reply.'
    : null
}
