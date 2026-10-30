import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadFile } from '@/services/files/fileApi'
import { problemFor, type AttachmentProblem } from '@/services/files/attachmentProblems'
import { prepareImage } from '@/services/files/prepareImage'
import {
  ATTACHMENTS_PER_MESSAGE,
  isPreparedImage,
  rejectionFor,
  uploadRejectionFor,
} from '@/services/files/uploadLimits'
import type { ChatAttachment } from '@/types/chat'
import type { AttachmentReference } from '@/types/file'

/** One file chosen in the composer, from the moment it is picked. */
export type AttachmentDraft = {
  /** Ours, for the row; the server's id arrives only once it is uploaded. */
  localId: string
  filename: string
  sizeBytes: number
  mimeType: string
  state: 'uploading' | 'ready' | 'failed'
  /**
   * The validated upload a message refers to, as `{uploadId}`. Present exactly
   * when `state` is `ready`; the attachment itself is made when the message is.
   */
  uploadId?: string
  /** When the upload can no longer be sent, from its intent; with `uploadId`. */
  expiresAt?: string
  /** Why it failed, as something the student can read. */
  problem?: AttachmentProblem
}

/** Time enough for a question to reach the server once it is sent. */
const EXPIRY_MARGIN_MS = 2 * 60 * 1000

/**
 * A photo goes up as the JPEG the browser made of it (#508); any other file
 * goes up as it is. Photos are prepared one at a time (`serially`): eight
 * chosen at once and decoded together held all eight in a phone's memory.
 *
 * The JPEG is held against the backend's 10 MB once more. At 1568 px a side
 * it cannot come near that, so one that does is a fault here, not a photo too
 * big to send, and is said as one: the tray's "too big" names the 30 MB a
 * photo may be as chosen.
 */
async function prepareAndUpload(
  file: File,
  serially: <T>(work: () => Promise<T>) => Promise<T>,
  signal: AbortSignal,
) {
  if (!isPreparedImage(file.name)) return uploadFile({ file, signal })
  // One taken out while it waited its turn is not opened at all.
  const prepared = await serially(() =>
    signal.aborted ? Promise.reject(new DOMException('aborted', 'AbortError')) : prepareImage(file),
  )
  if (uploadRejectionFor(prepared) === 'tooLarge') {
    throw new Error(`${prepared.name} is still over the upload limit once shrunk.`)
  }
  return uploadFile({ file: prepared, signal })
}

let counter = 0
const nextLocalId = () => `attachment-${Date.now()}-${(counter += 1)}`

const hasId = (draft: AttachmentDraft): draft is AttachmentDraft & { uploadId: string } =>
  Boolean(draft.uploadId)

/**
 * The files waiting to go out with the next question (#125).
 *
 * The backend's upload path -- intent, parts (straight to S3, #516), complete
 * -- never went away; the front of it did, with the online classroom. This is
 * that front: files are uploaded as soon as they are chosen, so pressing send
 * only has ids to pass, and `attachmentIds` on the message is never a promise
 * the upload has not kept.
 * The ids are the uploads' own: an upload that passed is `validated`, and the
 * message that carries `{uploadId}` is what makes it an attachment (#507).
 *
 * A photo is shrunk and written again as a JPEG in the browser first
 * (`prepareImage`, #508), which drops its EXIF and turns a HEIC into
 * something the backend takes.
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
  // Each file still on its way, by row: taking it out stops its upload (#516).
  const inFlight = useRef(new Map<string, AbortController>())
  const letGo = useCallback((localIds: Iterable<string>) => {
    for (const localId of localIds) {
      inFlight.current.get(localId)?.abort()
      inFlight.current.delete(localId)
    }
  }, [])
  // The photo being prepared, which the next one waits for.
  const preparing = useRef<Promise<unknown>>(Promise.resolve())
  const serially = useCallback(<T,>(work: () => Promise<T>) => {
    const done = preparing.current.then(work)
    preparing.current = done.catch(() => undefined)
    return done
  }, [])
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    const uploads = inFlight.current
    return () => {
      mounted.current = false
      // Closed with files still going up: nothing will send them.
      for (const controller of uploads.values()) controller.abort()
      uploads.clear()
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
        const controller = new AbortController()
        inFlight.current.set(localId, controller)
        void prepareAndUpload(file, serially, controller.signal)
          .finally(() => {
            if (inFlight.current.get(localId) === controller) inFlight.current.delete(localId)
          })
          .then(
            // Named as it went up: a HEIC is a JPEG by now.
            (upload) =>
              settle(localId, {
                state: 'ready',
                uploadId: upload.uploadId,
                expiresAt: upload.expiresAt,
                filename: upload.filename,
                mimeType: upload.mimeType,
                sizeBytes: upload.sizeBytes,
              }),
            (error: unknown) => settle(localId, { state: 'failed', problem: problemFor(error) }),
          )
      }
    },
    [serially, settle, write],
  )

  const remove = useCallback(
    (localId: string) => {
      setOverflow(false)
      letGo([localId])
      write(held.current.filter((draft) => draft.localId !== localId))
    },
    [letGo, write],
  )

  const clear = useCallback(() => {
    setOverflow(false)
    letGo([...inFlight.current.keys()])
    write([])
  }, [letGo, write])

  /**
   * The question went out with the files that were ready. One that failed stays
   * on screen with its reason: dropping it silently would send the question
   * without the file and say nothing about it.
   */
  const clearSent = useCallback(() => {
    setOverflow(false)
    write(held.current.filter((draft) => draft.state !== 'ready'))
  }, [write])

  /**
   * An upload is one a message may carry for 30 minutes from its intent,
   * validated or not, and is refused as `upload_expired` after. Before a
   * question goes out, a file that is past that, or nearly, is failed as
   * `expired` -- which says to choose it again -- and the question is held, so
   * it never leaves without the file it was written for (#507). True when one
   * was.
   */
  const expireStale = useCallback(() => {
    const limit = Date.now() + EXPIRY_MARGIN_MS
    const stale = (draft: AttachmentDraft) =>
      draft.state === 'ready' && draft.expiresAt !== undefined && Date.parse(draft.expiresAt) <= limit
    if (!held.current.some(stale)) return false
    setOverflow(false)
    write(
      held.current.map(
        (draft): AttachmentDraft =>
          stale(draft)
            ? { ...draft, state: 'failed', problem: 'expired', uploadId: undefined, expiresAt: undefined }
            : draft,
      ),
    )
    return true
  }, [write])

  const ready = drafts.filter(hasId)

  return {
    drafts,
    overflow,
    add,
    remove,
    clear,
    clearSent,
    expireStale,
    /** What the message refers to, in the order the files were chosen. */
    readyReferences: ready.map((draft): AttachmentReference => ({ uploadId: draft.uploadId })),
    /**
     * The same files as the message's own bubble shows them, before the server
     * replies; until it does, the upload's id stands in for the attachment's.
     */
    readyAttachments: ready.map(
      (draft): ChatAttachment => ({
        id: draft.uploadId,
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
