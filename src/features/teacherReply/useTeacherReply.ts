import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  blockFromInput,
  classifyRefusal,
  plainTextFallback,
  replyProblem,
  storedBlock,
  type ReplyProblem,
} from '@/features/teacherReply/replyRules'
import {
  serverTeacherReplyAdapter,
  type TeacherReplyAdapter,
  type TeacherReplyBody,
} from '@/features/teacherReply/teacherReplyAdapter'
import { useAttachments, type AttachmentsView } from '@/features/uploads/useAttachments'
import i18n from '@/i18n'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { TeacherReplyBlock } from '@/types/teacher'

export type ReplyMode = TeacherReplyBlock['type']

/** The kinds of block the composer offers, in its order. */
export const REPLY_MODES = ['paragraph', 'formula', 'unordered_list', 'code'] as const satisfies readonly ReplyMode[]

export type TeacherReply = {
  /** The kind of block the input makes. */
  mode: ReplyMode
  /** What is typed and not yet queued. */
  value: string
  /** What is queued, as the student will see it. */
  blocks: TeacherReplyBlock[]
  setMode(mode: ReplyMode): void
  setValue(value: string): void
  /** Queues what is typed as a block; false when there is nothing to queue, or it may not go. */
  addBlock(): boolean
  removeBlock(index: number): void
  /** What would be sent now: the queue, and what is typed as its last block. */
  previewBlocks: TeacherReplyBlock[]
  /** Why it may not be sent, said in the composer; null when it may. */
  problem: ReplyProblem | null
  /**
   * Whether it would go now: words to send, nothing wrong with them, no reply
   * already on its way and no picture still going up.
   */
  canSend: boolean
  /** Sends it; true once the server took it. Says how it went itself. */
  send(): Promise<boolean>
  /** A reply is on its way. */
  sending: boolean
  /** The last reply was refused because the request moved on (409), until the next one is sent. */
  conflict: boolean
  /** The pictures it carries: `view` for `<Attachments>`, `pickFile` for the button. */
  attachments: { view: AttachmentsView; pickFile: () => void }
}

type ReplyDraft = { mode: ReplyMode; value: string; blocks: TeacherReplyBlock[] }

const emptyDraft: ReplyDraft = { mode: 'paragraph', value: '', blocks: [] }

/*
 * The draft outlives the composer: the page takes it away while a request
 * cannot be acted on, and a teacher may leave and come back (#331). Kept per
 * request for this tab only; storage that throws (private mode) just keeps
 * nothing.
 */
const draftStorageKey = (requestId: string) => `stoa.teacherReplyDraft.${requestId}`

function readDraft(requestId: string | undefined): ReplyDraft {
  if (!requestId) return emptyDraft
  try {
    const stored = JSON.parse(sessionStorage.getItem(draftStorageKey(requestId)) ?? 'null') as Partial<ReplyDraft> | null
    if (!stored || typeof stored.value !== 'string' || !Array.isArray(stored.blocks)) return emptyDraft
    const mode = (REPLY_MODES as readonly unknown[]).includes(stored.mode) ? (stored.mode as ReplyMode) : 'paragraph'
    return { mode, value: stored.value, blocks: stored.blocks.flatMap(storedBlock) }
  } catch {
    return emptyDraft
  }
}

function writeDraft(requestId: string | undefined, draft: ReplyDraft) {
  if (!requestId) return
  try {
    if (!draft.value && draft.blocks.length === 0) sessionStorage.removeItem(draftStorageKey(requestId))
    else sessionStorage.setItem(draftStorageKey(requestId), JSON.stringify(draft))
  } catch {
    // Nothing kept; the draft still lives on screen.
  }
}

/*
 * What the teacher reads when a reply did not go: whether to rewrite it, choose
 * a picture again, or look at the request again -- from the same reasons the
 * check before sending gives (#271, #332, #513).
 */
function replyFailureKey(error: unknown) {
  const refusal = classifyRefusal(error)
  if (refusal === 'images') return 'teacher:toasts.replyImagesExpired'
  if (refusal === 'conflict') return 'teacher:toasts.replyConflict'
  if (refusal === 'unknown') return 'teacher:toasts.replyRefused'
  if (refusal) return `teacher:toasts.replyRefusedBecause.${refusal}`
  return 'teacher:toasts.replyFailed'
}

/**
 * A teacher's reply to one help request, from the first word to the server
 * taking it (#564): the draft (kept per request in this tab), the queued
 * blocks, the check against what the server takes, the pictures, and the
 * sending -- its toasts, the list and stats read again, a refused picture
 * marked to be chosen again.
 *
 * The page gives the request's id and reads `conflict`;
 * `<TeacherReplyComposer reply={reply} />` draws the rest.
 */
export function useTeacherReply(
  requestId: string | undefined,
  { adapter = serverTeacherReplyAdapter }: { adapter?: TeacherReplyAdapter } = {},
): TeacherReply {
  const queryClient = useQueryClient()
  // The draft is the request's: another request reads its own.
  const [held, setHeld] = useState(() => ({ requestId, draft: readDraft(requestId) }))
  if (held.requestId !== requestId) setHeld({ requestId, draft: readDraft(requestId) })
  const { mode, value, blocks } = held.draft
  const uploads = useAttachments({ purpose: 'help_reply_image', imagesOnly: true, camera: false, phone: false })

  const mutation = useMutation({
    mutationFn: ({ requestId: id, body }: { requestId: string; body: TeacherReplyBody }) => adapter.addNote(id, body),
    onSuccess: (note, variables) => {
      trackEvent('teacher_note_added', { requestId: variables.requestId, noteId: note.id })
      toast.success(i18n.t('teacher:toasts.replySent'))
      // A reply to an offer is also its acceptance (now `in_progress`), so the
      // list and the stats move too, not only the detail (#269). The list key
      // is the detail's prefix.
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
    onError: (error) => {
      toast.error(i18n.t(replyFailureKey(error)))
      if (classifyRefusal(error) !== 'conflict') return
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
  })

  useEffect(() => {
    writeDraft(held.requestId, held.draft)
  }, [held])

  const update = (change: (draft: ReplyDraft) => ReplyDraft) =>
    setHeld((current) => ({ requestId: current.requestId, draft: change(current.draft) }))

  const previewBlocks = useMemo(() => {
    const trimmed = value.trim()
    return trimmed ? [...blocks, blockFromInput(mode, trimmed)] : blocks
  }, [blocks, mode, value])
  const problem = useMemo(() => replyProblem(previewBlocks), [previewBlocks])
  const sending = mutation.isPending
  // A reply waits for its pictures, and still needs words: the backend takes
  // no reply made of pictures alone.
  const canSend = previewBlocks.length > 0 && !sending && !problem && !uploads.busy

  function addBlock() {
    const trimmed = value.trim()
    if (!trimmed || replyProblem([...blocks, blockFromInput(mode, trimmed)])) return false
    update((draft) => ({ ...draft, value: '', blocks: [...draft.blocks, blockFromInput(draft.mode, trimmed)] }))
    return true
  }

  async function send() {
    if (!requestId || !canSend) return false
    // A picture past its time is said, and the reply held, rather than refused.
    const images = uploads.take()
    if (!images) return false
    const richContent = { version: 1 as const, blocks: previewBlocks }
    const body: TeacherReplyBody = {
      content: plainTextFallback(richContent),
      richContent,
      attachmentIds: images.references,
    }
    try {
      await mutation.mutateAsync({ requestId, body })
    } catch (error) {
      // The server took none of it: only the pictures are chosen again (#513).
      if (classifyRefusal(error) === 'images') images.refused()
      return false
    }
    writeDraft(requestId, emptyDraft)
    setHeld((current) => (current.requestId === requestId ? { requestId, draft: emptyDraft } : current))
    images.sent()
    return true
  }

  return {
    mode,
    value,
    blocks,
    setMode: (next) => update((draft) => ({ ...draft, mode: next })),
    setValue: (next) => update((draft) => ({ ...draft, value: next })),
    addBlock,
    removeBlock: (index) => update((draft) => ({ ...draft, blocks: draft.blocks.filter((_, at) => at !== index) })),
    previewBlocks,
    problem,
    canSend,
    send,
    sending,
    conflict: classifyRefusal(mutation.error) === 'conflict',
    attachments: { view: uploads.view, pickFile: uploads.sources.pickFile },
  }
}
