import { useTranslation } from 'react-i18next'
import { AttachmentPictures } from '@/features/attachments/AttachmentPictures'
import { teacherHelpAttachments } from '@/features/attachments/attachmentReaders'
import type { AttachmentSummary } from '@/types/file'

/**
 * The files the student sent with a message of the help request (#510), shown
 * by the attachment viewer (#563) and read through this request.
 *
 * A teacher's reply carries pictures too (#513), read through the same route;
 * `byTeacher` names them as the teacher's, not the student's.
 */
export function HelpRequestAttachments({
  requestId,
  attachments,
  byTeacher = false,
}: {
  requestId: string
  attachments?: AttachmentSummary[]
  byTeacher?: boolean
}) {
  const { t } = useTranslation('teacher')
  return (
    <AttachmentPictures
      look="teacher"
      reader={teacherHelpAttachments(requestId)}
      attachments={(attachments ?? []).map((attachment) => ({
        id: attachment.attachmentId,
        filename: attachment.filename,
        mediaType: attachment.mediaType,
        available: attachment.status === 'active',
      }))}
      copy={{
        label: t('detail.attachments.label'),
        loading: t('detail.attachments.loading'),
        failed: t('detail.attachments.failed'),
        unavailable: t('detail.attachments.unavailable'),
        retry: t('detail.attachments.retry'),
        alt: (name) => t(byTeacher ? 'detail.attachments.altTeacher' : 'detail.attachments.alt', { name }),
        open: (name) => t('detail.attachments.open', { name }),
        retryNamed: (name) => t('detail.attachments.retryNamed', { name }),
      }}
    />
  )
}
