import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, ImageOff } from 'lucide-react'
import { Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { Button as UiButton } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { AttachmentReader } from '@/features/attachments/attachmentReaders'
import { drawnType, useObjectUrl } from '@/features/uploads/drawnImage'
import { ApiError } from '@/services/api/httpClient'

/** All the viewer knows of a file; each caller maps its own shape to this. */
export type AttachmentPicture = {
  id: string
  filename: string
  mediaType: string
  /** False for one removed or failed: it is not read, only a placeholder. */
  available: boolean
}

/** What the viewer says, translated by the caller. */
export type AttachmentPicturesCopy = {
  label: string
  loading: string
  failed: string
  unavailable: string
  retry: string
  alt: (name: string) => string
  open: (name: string) => string
  /** Starts with `retry` (WCAG 2.5.3, label in name). */
  retryNamed: (name: string) => string
}

/**
 * The pictures sent in a help request's thread (#563): the teacher's view of
 * what the student sent and of their own replies (#510), and the student's
 * view of a teacher's reply (#513). A picture shows as a thumbnail that opens
 * larger; one removed, one this reader may not read (any more), or one that is
 * not a picture the browser draws is a placeholder, never an error. A file that
 * is not a picture is named.
 *
 * `look` only switches the classes and the button; the two sides look as they
 * did before the module.
 */
export function AttachmentPictures({
  attachments,
  reader,
  copy,
  look,
}: {
  attachments: readonly AttachmentPicture[]
  reader: AttachmentReader
  copy: AttachmentPicturesCopy
  look: AttachmentPicturesLook
}) {
  if (attachments.length === 0) return null
  const style = LOOKS[look]
  return (
    <ul {...{ [style.countAttribute]: attachments.length }} aria-label={copy.label} className={style.list}>
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {!attachment.available ? (
            <Unavailable filename={attachment.filename} copy={copy} style={style} />
          ) : attachment.mediaType.startsWith('image/') ? (
            <Picture attachment={attachment} reader={reader} copy={copy} style={style} />
          ) : (
            // Only pictures open here; another file is named, so it is known
            // one was sent.
            <span className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
              <FileText aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{attachment.filename}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export type AttachmentPicturesLook = 'student' | 'teacher'

type Look = {
  countAttribute: string
  list: string
  tile: string
  thumbnail: string
  unavailableIcon: ReactNode
  retry: (props: { label: string; text: string; onClick: () => void }) => ReactNode
}

const LOOKS: Record<AttachmentPicturesLook, Look> = {
  student: {
    countAttribute: 'data-teacher-images',
    list: 'm-0 flex list-none flex-wrap gap-2 p-0',
    tile: 'flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-[12px] border border-[color:var(--card-border)] bg-surface p-2 text-center text-[12px] text-caption',
    thumbnail: 'block h-24 w-32 overflow-hidden rounded-[12px] border border-[color:var(--card-border)]',
    unavailableIcon: <ImageOff aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />,
    retry: ({ label, text, onClick }) => (
      <Button variant="plain" size="small" aria-label={label} onClick={onClick}>
        {text}
      </Button>
    ),
  },
  teacher: {
    countAttribute: 'data-help-attachments',
    list: 'm-0 mt-2 flex list-none flex-wrap gap-2 p-0',
    tile: 'flex min-h-24 w-32 flex-col items-center justify-center gap-1 rounded-md border bg-secondary p-2 text-center text-xs text-muted-foreground',
    // The focus ring is the one in the base layer (#83).
    thumbnail: 'block h-24 w-32 overflow-hidden rounded-md border',
    unavailableIcon: <ImageOff aria-hidden="true" className="size-5 shrink-0" />,
    retry: ({ label, text, onClick }) => (
      <UiButton type="button" size="sm" variant="outline" aria-label={label} onClick={onClick}>
        {text}
      </UiButton>
    ),
  },
}

/** Not this reader's to read (403), or gone (404): asking again cannot change that. */
function isOutOfReach(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

/**
 * A file does not change once sent: read once, and not again with every poll
 * or refetch of the thread, nor when a language switch invalidates every query
 * (`'static'` keeps it out of `invalidateQueries`). Its key is under none of
 * the thread's own, so nothing done to those (a remove, a reset) takes the
 * pictures with it. Refused, it is not asked for again; any other failure
 * gets the app's one retry.
 */
function useAttachmentContent(reader: AttachmentReader, attachmentId: string) {
  return useQuery({
    queryKey: ['attachment-content', ...reader.scope, attachmentId],
    queryFn: () => reader.read(attachmentId),
    staleTime: 'static',
    retry: (failureCount, error) => !isOutOfReach(error) && failureCount < 1,
  })
}

function Picture({
  attachment,
  reader,
  copy,
  style,
}: {
  attachment: AttachmentPicture
  reader: AttachmentReader
  copy: AttachmentPicturesCopy
  style: Look
}) {
  const query = useAttachmentContent(reader, attachment.id)
  const blob = query.data && drawnType(query.data) ? query.data : undefined
  const url = useObjectUrl(blob)
  // Read, but not a picture the browser can draw.
  const [undrawable, setUndrawable] = useState(false)
  const name = attachment.filename
  const alt = copy.alt(name)

  if (undrawable || (query.data && !blob) || isOutOfReach(query.error)) {
    return <Unavailable filename={name} copy={copy} style={style} />
  }
  // A failed read again keeps a picture already on screen.
  if (query.isError && !query.data) {
    return (
      <div className={style.tile} data-attachment-state="failed">
        <span>{copy.failed}</span>
        {style.retry({ label: copy.retryNamed(name), text: copy.retry, onClick: () => void query.refetch() })}
      </div>
    )
  }
  if (!url) {
    return (
      <div className={style.tile} data-attachment-state="loading" aria-busy="true">
        {copy.loading}
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={copy.open(name)} className={style.thumbnail}>
          <img src={url} alt={alt} className="size-full object-cover" onError={() => setUndrawable(true)} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl" aria-describedby={undefined}>
        <DialogTitle className="pr-8 text-base break-all">{name}</DialogTitle>
        <img src={url} alt={alt} className="mx-auto max-h-[75dvh] w-auto max-w-full object-contain" />
      </DialogContent>
    </Dialog>
  )
}

function Unavailable({ filename, copy, style }: { filename: string; copy: AttachmentPicturesCopy; style: Look }) {
  return (
    <div className={style.tile} data-attachment-state="unavailable" title={filename}>
      {style.unavailableIcon}
      <span>{copy.unavailable}</span>
    </div>
  )
}
