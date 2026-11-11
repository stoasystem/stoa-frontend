import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { TOUCH_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { uploadFile } from '@/services/files/fileApi'
import { problemFor, type AttachmentProblem } from '@/services/files/attachmentProblems'
import { prepareImage } from '@/services/files/prepareImage'
import {
  ATTACHMENTS_PER_MESSAGE,
  imageRejectionFor,
  isPreparedImage,
  rejectionFor,
  uploadRejectionFor,
} from '@/services/files/uploadLimits'
import type { ChatAttachment } from '@/types/chat'
import type { UploadPurpose, ValidatedUpload } from '@/types/file'

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

/**
 * Where a file goes up: the upload API (intent, parts straight to S3, complete;
 * #516) unless a test hands in its own. A photo is prepared before it gets here.
 */
export type AttachmentUploader = {
  upload(file: File, purpose: UploadPurpose, signal: AbortSignal): Promise<ValidatedUpload>
}

const uploadApi: AttachmentUploader = {
  upload: (file, purpose, signal) => uploadFile({ file, purpose, signal }),
}

/**
 * The files ready to go, taken for one message. Sending is the caller's: once
 * the message is out, `sent()` takes them from the tray; when the server would
 * not take them -- each already sent, or past its time -- and took nothing,
 * `refused()` marks each to be chosen again. Files chosen meanwhile are not
 * part of it.
 */
export type AttachmentBatch = {
  /** What the message refers to, in the order the files were chosen. */
  references: Array<{ uploadId: string }>
  /**
   * The same files as the message's own bubble shows them, before the server
   * replies; until it does, the upload's id stands in for the attachment's.
   */
  attachments: ChatAttachment[]
  sent(): void
  refused(): void
}

/** The ways to add a file the composer offers; one left out is not offered. */
export type AttachmentSources = {
  /** The chooser: files, and the photo gallery. */
  pickFile: () => void
  /** The camera. Only on a touch screen, where `capture` opens it (#509). */
  takePhoto?: () => void
  /** A photo from the phone, by QR (#514). Not on a touch screen: the camera is right there. */
  usePhone?: () => void
}

/**
 * What `<Attachments>` draws. The module's own: the caller hands it through
 * and reads nothing in it.
 */
export type AttachmentsView = {
  drafts: readonly AttachmentDraft[]
  overflow: boolean
  imagesOnly: boolean
  /** The conversation a phone's code is made for (none for a new question); false for no phone. */
  phone: string | null | false
  camera: boolean
  picker: RefObject<HTMLInputElement | null>
  cameraInput: RefObject<HTMLInputElement | null>
  /** Where the phone's card puts the start of a fresh code, for `usePhone`. */
  phoneStart: { current: (() => void) | null }
  add: (chosen: readonly File[]) => void
  adopt: (upload: ValidatedUpload) => void
  remove: (localId: string) => void
}

/**
 * Which of the camera and the phone this device is offered, of those asked
 * for. Taking a photo and choosing one are two entries (#509): with `capture`
 * a phone opens the camera and offers no gallery, without it the gallery and
 * files. Only where the camera opens is there a camera to offer; there the
 * camera is also right at hand, so no QR is offered to send a phone's photo
 * (#514). Shared with Ask's docked +, which offers the same menu before Ask's
 * own composer is there.
 */
export function useOfferedSources({ camera, phone }: { camera: boolean; phone: boolean }) {
  const touch = useMediaQuery(TOUCH_QUERY)
  return { camera: camera && touch, phone: phone && !touch }
}

/** Time enough for a message to reach the server once it is sent. */
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
  uploader: AttachmentUploader,
  file: File,
  purpose: UploadPurpose,
  serially: <T>(work: () => Promise<T>) => Promise<T>,
  signal: AbortSignal,
) {
  if (!isPreparedImage(file.name)) return uploader.upload(file, purpose, signal)
  // One taken out while it waited its turn is not opened at all.
  const prepared = await serially(() =>
    signal.aborted ? Promise.reject(new DOMException('aborted', 'AbortError')) : prepareImage(file),
  )
  if (uploadRejectionFor(prepared) === 'tooLarge') {
    throw new Error(`${prepared.name} is still over the upload limit once shrunk.`)
  }
  return uploader.upload(prepared, purpose, signal)
}

let counter = 0
const nextLocalId = () => `attachment-${Date.now()}-${(counter += 1)}`

const hasId = (draft: AttachmentDraft): draft is AttachmentDraft & { uploadId: string } =>
  Boolean(draft.uploadId)

/** Failed as `expired`, which says to choose it again. */
const expired = (draft: AttachmentDraft): AttachmentDraft => ({
  ...draft,
  state: 'failed',
  problem: 'expired',
  uploadId: undefined,
  expiresAt: undefined,
})

/**
 * The files waiting to go out with the next message (#125), from the moment
 * they are chosen to the moment a message takes them (#561).
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
 *
 * Three sources fill it: the chooser, the camera (`camera`, offered on a touch
 * screen only) and a phone by QR (`phone`, offered off a touch screen only).
 * Their inputs, the phone's card and the tray are drawn by
 * `<Attachments view={view} />`; the caller says where, and wires `sources`
 * to its buttons.
 *
 * Sending is one call: `take()` gives the files ready to go, or null when the
 * message must wait -- a file still going up, or one past its time, which the
 * tray then says -- and the caller settles the batch, `sent()` or `refused()`,
 * once it knows.
 *
 * A student's files go up as `conversation_attachment`. A teacher's reply takes
 * photos only, as `help_reply_image` (#513): `imagesOnly` refuses anything else
 * before it goes, as the backend would after.
 */
export function useAttachments({
  purpose = 'conversation_attachment',
  imagesOnly = false,
  camera = false,
  phone = false,
  uploader = uploadApi,
}: {
  purpose?: UploadPurpose
  imagesOnly?: boolean
  /** Offers the camera, where there is one to open. */
  camera?: boolean
  /** The conversation open, for a phone's code (null for a new question); false for no phone at all. */
  phone?: string | null | false
  uploader?: AttachmentUploader
} = {}) {
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
        const rejection = imagesOnly ? imageRejectionFor(file) : rejectionFor(file)
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
        void prepareAndUpload(uploader, file, purpose, serially, controller.signal)
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
    [imagesOnly, purpose, serially, settle, uploader, write],
  )

  /**
   * A photo already up and passed, which the student chose to add: the one a
   * phone sent by QR (#514). It joins the tray ready, once, if there is room.
   */
  const adopt = useCallback(
    (upload: ValidatedUpload) => {
      if (held.current.some((draft) => draft.uploadId === upload.uploadId)) return
      if (held.current.length >= ATTACHMENTS_PER_MESSAGE) {
        setOverflow(true)
        return
      }
      setOverflow(false)
      write([...held.current, { localId: nextLocalId(), state: 'ready', ...upload }])
    },
    [write],
  )

  const remove = useCallback(
    (localId: string) => {
      setOverflow(false)
      letGo([localId])
      write(held.current.filter((draft) => draft.localId !== localId))
    },
    [letGo, write],
  )

  /**
   * Every file out of the tray, those still going up stopped. For a teacher's
   * reply moving to another request (#564): files chosen for one request's
   * reply must not go out with another's.
   */
  const reset = useCallback(() => {
    setOverflow(false)
    letGo([...inFlight.current.keys()])
    write([])
  }, [letGo, write])

  /**
   * An upload is one a message may carry for 30 minutes from its intent,
   * validated or not, and is refused as `upload_expired` after. Before a
   * message goes out, a file that is past that, or nearly, is failed as
   * `expired` -- which says to choose it again -- and the message is held, so
   * it never leaves without the file it was written for (#507). True when one
   * was.
   */
  const expireStale = useCallback(() => {
    const limit = Date.now() + EXPIRY_MARGIN_MS
    const stale = (draft: AttachmentDraft) =>
      draft.state === 'ready' && draft.expiresAt !== undefined && Date.parse(draft.expiresAt) <= limit
    if (!held.current.some(stale)) return false
    setOverflow(false)
    write(held.current.map((draft) => (stale(draft) ? expired(draft) : draft)))
    return true
  }, [write])

  const take = useCallback((): AttachmentBatch | null => {
    // A message waits for its files: sent now, it would leave one behind.
    if (held.current.some((draft) => draft.state === 'uploading')) return null
    if (expireStale()) return null
    const ready = held.current.filter(hasId)
    const batch = new Set(ready.map((draft) => draft.localId))
    const createdAt = new Date().toISOString()
    return {
      references: ready.map((draft) => ({ uploadId: draft.uploadId })),
      attachments: ready.map(
        (draft): ChatAttachment => ({
          id: draft.uploadId,
          filename: draft.filename,
          mimeType: draft.mimeType,
          sizeBytes: draft.sizeBytes,
          status: 'uploaded',
          createdAt,
        }),
      ),
      // The message went out with these. One that failed stays on screen with
      // its reason: dropping it silently would send the message without the
      // file and say nothing about it.
      sent: () => {
        setOverflow(false)
        write(held.current.filter((draft) => !batch.has(draft.localId)))
      },
      // The server would not take them, and nothing was sent (#513).
      refused: () => {
        write(held.current.map((draft) => (batch.has(draft.localId) && draft.state === 'ready' ? expired(draft) : draft)))
      },
    }
  }, [expireStale, write])

  const picker = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const phoneStart = useRef<(() => void) | null>(null)
  const offered = useOfferedSources({ camera, phone: phone !== false })
  const pickFile = useCallback(() => picker.current?.click(), [])
  const takePhoto = useCallback(() => cameraInput.current?.click(), [])
  const usePhone = useCallback(() => phoneStart.current?.(), [])

  const view: AttachmentsView = {
    drafts,
    overflow,
    imagesOnly,
    phone,
    camera,
    picker,
    cameraInput,
    phoneStart,
    add,
    adopt,
    remove,
  }
  const sources: AttachmentSources = {
    pickFile,
    takePhoto: offered.camera ? takePhoto : undefined,
    usePhone: offered.phone ? usePhone : undefined,
  }

  return {
    /** For `<Attachments view={view} />`, and nothing else. */
    view,
    sources,
    take,
    /** Empties the tray and stops what is still going up: the reply's, on another request (#564). */
    reset,
    /** A file is still going up: a message sent now would wait for it (the composer's `busy`). */
    busy: drafts.some((draft) => draft.state === 'uploading'),
  }
}
