import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { drawnType, useObjectUrl } from '@/features/uploads/drawnImage'
import { isAttachmentOutOfReach, useAttachmentContentQuery } from '@/hooks/chat/useAttachmentContentQuery'
import type { ChatAttachment } from '@/types/chat'

/**
 * The pictures a teacher replied with (#513, stoa-backend#145). Unlike the
 * student's own files, which the thread only names, these are new to the
 * student: each shows as a thumbnail that opens larger. One removed, one the
 * student may not read, or one that is not a picture the browser draws is a
 * placeholder, never an error.
 */
export function TeacherReplyImages({ attachments, teacher }: { attachments?: ChatAttachment[]; teacher: string }) {
  const { t } = useTranslation('chat')
  const pictures = (attachments ?? []).filter((attachment) => attachment.mimeType.startsWith('image/'))
  if (pictures.length === 0) return null
  return (
    <ul
      data-teacher-images={pictures.length}
      aria-label={t('ask.teacherImages.label')}
      className="m-0 flex list-none flex-wrap gap-2 p-0"
    >
      {pictures.map((attachment) => (
        <li key={attachment.id}>
          {attachment.status === 'failed' ? (
            <Unavailable filename={attachment.filename} />
          ) : (
            <Picture attachment={attachment} teacher={teacher} />
          )}
        </li>
      ))}
    </ul>
  )
}

const TILE =
  'flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-[12px] border border-[color:var(--card-border)] bg-surface p-2 text-center text-[12px] text-caption'

function Picture({ attachment, teacher }: { attachment: ChatAttachment; teacher: string }) {
  const { t } = useTranslation('chat')
  const query = useAttachmentContentQuery(attachment.id)
  const blob = query.data && drawnType(query.data) ? query.data : undefined
  const url = useObjectUrl(blob)
  // Read, but not a picture the browser can draw.
  const [undrawable, setUndrawable] = useState(false)
  const name = attachment.filename
  const alt = t('ask.teacherImages.alt', { teacher, name })

  if (undrawable || (query.data && !blob) || isAttachmentOutOfReach(query.error)) {
    return <Unavailable filename={name} />
  }
  // A failed read again keeps a picture already on screen.
  if (query.isError && !query.data) {
    return (
      <div className={TILE} data-attachment-state="failed">
        <span>{t('ask.teacherImages.failed')}</span>
        <Button
          variant="plain"
          size="small"
          aria-label={t('ask.teacherImages.retryNamed', { name })}
          onClick={() => void query.refetch()}
        >
          {t('ask.teacherImages.retry')}
        </Button>
      </div>
    )
  }
  if (!url) {
    return (
      <div className={TILE} data-attachment-state="loading" aria-busy="true">
        {t('ask.teacherImages.loading')}
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('ask.teacherImages.open', { name })}
          className="block h-24 w-32 overflow-hidden rounded-[12px] border border-[color:var(--card-border)]"
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
  const { t } = useTranslation('chat')
  return (
    <div className={TILE} data-attachment-state="unavailable" title={filename}>
      <ImageOff aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />
      <span>{t('ask.teacherImages.unavailable')}</span>
    </div>
  )
}
