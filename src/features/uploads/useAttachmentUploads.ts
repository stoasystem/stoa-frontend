import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadFile } from '@/services/files/fileApi'
import { problemFor, type AttachmentProblem } from '@/services/files/attachmentProblems'
import { ATTACHMENTS_PER_MESSAGE, rejectionFor } from '@/services/files/uploadLimits'
import type { ChatAttachment } from '@/types/chat'

/** One file chosen in the composer, from the moment it is picked. */
export type AttachmentDraft = {
  /** Ours, for the row; the server's id arrives only once it is uploaded. */
  localId: string
  filename: string
  sizeBytes: number
  mimeType: string
  state: 'uploading' | 'ready' | 'failed'
  /** The id a message refers to. Present exactly when `state` is `ready`. */
  attachmentId?: string
  /** Why it failed, as something the student can read. */
  problem?: AttachmentProblem
}

let counter = 0
const nextLocalId = () => `attachment-${Date.now()}-${(counter += 1)}`

const hasId = (draft: AttachmentDraft): draft is AttachmentDraft & { attachmentId: string } =>
  Boolean(draft.attachmentId)

/**
 * The files waiting to go out with the next question (#125).
 *
 * The backend's upload path -- intent, chunks, complete -- never went away; the
 * front of it did, with the online classroom. This is that front: files are
 * uploaded as soon as they are chosen, so pressing send only has ids to pass,
 * and `attachmentIds` on the message is never a promise the upload has not kept.
 *
 * Nothing here reads the server's prose. A file that cannot be sent at all is
 * refused before the first request (`rejectionFor`); a request that fails comes
 * back as one of a handful of problems with a sentence of its own.
 *
 * The list is held in a ref beside the state and every change is computed from
 * the ref. Starting an upload is not something a React updater may do -- an
 * updater runs when React renders, which is after the handler that chose the
 * file has returned, so uploads started inside one were started from a list
 * nobody had filled in yet, and none of them ever left.
 */
export function useAttachmentUploads() {
  const [drafts, setDrafts] = useState<AttachmentDraft[]>([])
  /** More files were chosen than a message carries; the extras were left out. */
  const [overflow, setOverflow] = useState(false)
  const held = useRef<AttachmentDraft[]>([])
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const write = useCallback((next: AttachmentDraft[]) => {
    held.current = next
    setDrafts(next)
  }, [])

  const settle = useCallback(
    (localId: string, patch: Partial<AttachmentDraft>) => {
      if (!mounted.current) return
      write(held.current.map((draft) => (draft.localId === localId ? { ...draft, ...patch } : draft)))
    },
    [write],
  )

  const add = useCallback(
    (chosen: readonly File[]) => {
      if (chosen.length === 0) return
      const room = Math.max(0, ATTACHMENTS_PER_MESSAGE - held.current.length)
      setOverflow(chosen.length > room)
      const started: Array<{ localId: string; file: File }> = []
      const made = chosen.slice(0, room).map((file) => {
        const rejection = rejectionFor(file)
        const draft: AttachmentDraft = {
          localId: nextLocalId(),
          filename: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
          state: rejection ? 'failed' : 'uploading',
          ...(rejection ? { problem: rejection satisfies AttachmentProblem } : {}),
        }
        if (!rejection) started.push({ localId: draft.localId, file })
        return draft
      })
      write([...held.current, ...made])
      for (const { localId, file } of started) {
        void uploadFile({ file }).then(
          (file) =>
            settle(localId, {
              state: file.status === 'failed' ? 'failed' : 'ready',
              ...(file.status === 'failed'
                ? { problem: 'failed' as const }
                : { attachmentId: file.id }),
            }),
          (error: unknown) => settle(localId, { state: 'failed', problem: problemFor(error) }),
        )
      }
    },
    [settle, write],
  )

  const remove = useCallback(
    (localId: string) => {
      setOverflow(false)
      write(held.current.filter((draft) => draft.localId !== localId))
    },
    [write],
  )

  const clear = useCallback(() => {
    setOverflow(false)
    write([])
  }, [write])

  /**
   * The question went out with the files that were ready. One that failed stays
   * on screen with its reason: dropping it silently would send the question
   * without the file and say nothing about it.
   */
  const clearSent = useCallback(() => {
    setOverflow(false)
    write(held.current.filter((draft) => draft.state !== 'ready'))
  }, [write])

  const ready = drafts.filter(hasId)

  return {
    drafts,
    overflow,
    add,
    remove,
    clear,
    clearSent,
    /** The ids to send, in the order they were chosen. */
    readyIds: ready.map((draft) => draft.attachmentId),
    /** The same files as the message's own bubble shows them, before the server replies. */
    readyAttachments: ready.map(
      (draft): ChatAttachment => ({
        id: draft.attachmentId,
        filename: draft.filename,
        mimeType: draft.mimeType,
        sizeBytes: draft.sizeBytes,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
      }),
    ),
    /** A question waits for its files: sending now would leave them behind. */
    uploading: drafts.some((draft) => draft.state === 'uploading'),
  }
}
