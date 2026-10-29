import { useEffect, useState } from 'react'
import { FileText, ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useTeacherHelpAttachmentQuery } from '@/hooks/teacher/useTeacherHelpAttachmentQuery'
import { isHelpRequestOutOfReach } from '@/lib/teacherHelpRequestConflict'
import type { AttachmentSummary } from '@/types/file'

/**
 * The files the student sent with a message of the help request (#510). A
 * picture shows as a thumbnail that opens larger; one this teacher may not
 * read (any more), or one removed, is a placeholder, never an error.
 */
export function HelpRequestAttachments({
  requestId,
  attachments,
}: {
  requestId: string
  attachments?: AttachmentSummary[]
}) {
  const { t } = useTranslation('teacher')
  if (!attachments || attachments.length === 0) return null
  return (
    <ul
      data-help-attachments={attachments.length}
      aria-label={t('detail.attachments.label')}
      className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0"
    >
      {attachments.map((attachment) => (
        <li key={attachment.attachmentId}>
          {attachment.status !== 'active' ? (
            <Unavailable filename={attachment.filename} />
          ) : attachment.mediaType.startsWith('image/') ? (
            <AttachmentImage requestId={requestId} attachment={attachment} />
          ) : (
            // Only pictures open here; another file is named, so the teacher
            // knows the student sent one.
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

const TILE = 'flex min-h-24 w-32 flex-col items-center justify-center gap-1 rounded-md border bg-secondary p-2 text-center text-xs text-muted-foreground'

function AttachmentImage({ requestId, attachment }: { requestId: string; attachment: AttachmentSummary }) {
  const { t } = useTranslation('teacher')
  const query = useTeacherHelpAttachmentQuery(requestId, attachment.attachmentId)
  const url = useObjectUrl(query.data)
  // Read, but not a picture the browser can draw.
  const [undrawable, setUndrawable] = useState(false)
  const name = attachment.filename
  const alt = t('detail.attachments.alt', { name })

  if (undrawable || isHelpRequestOutOfReach(query.error)) return <Unavailable filename={name} />
  if (query.isError) {
    return (
      <div className={TILE} data-attachment-state="failed">
        <span>{t('detail.attachments.failed')}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={t('detail.attachments.retryNamed', { name })}
          onClick={() => void query.refetch()}
        >
          {t('detail.attachments.retry')}
        </Button>
      </div>
    )
  }
  if (!url) {
    return (
      <div className={TILE} data-attachment-state="loading" aria-busy="true">
        {t('detail.attachments.loading')}
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('detail.attachments.open', { name })}
          // The focus ring is the one in the base layer (#83).
          className="block h-24 w-32 overflow-hidden rounded-md border"
        >
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

function Unavailable({ filename }: { filename: string }) {
  const { t } = useTranslation('teacher')
  return (
    <div className={TILE} data-attachment-state="unavailable" title={filename}>
      <ImageOff aria-hidden="true" className="size-5 shrink-0" />
      <span>{t('detail.attachments.unavailable')}</span>
    </div>
  )
}

/** An address for the blob while it is on screen, released when it leaves. */
function useObjectUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return undefined
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => {
      URL.revokeObjectURL(next)
      setUrl(undefined)
    }
  }, [blob])
  return url
}
