import { useTranslation } from 'react-i18next'
import { AttachmentPictures } from '@/features/attachments/AttachmentPictures'
import { studentAttachments } from '@/features/attachments/attachmentReaders'
import type { ChatAttachment } from '@/types/chat'

/**
 * The pictures a teacher replied with (#513, stoa-backend#145), shown by the
 * attachment viewer (#563). Unlike the student's own files, which the thread
 * only names, these are new to the student: each shows as a thumbnail that
 * opens larger, named with the teacher's name.
 */
export function TeacherReplyImages({ attachments, teacher }: { attachments?: ChatAttachment[]; teacher: string }) {
  const { t } = useTranslation('chat')
  return (
    <AttachmentPictures
      look="student"
      reader={studentAttachments}
      attachments={(attachments ?? []).map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        mediaType: attachment.mimeType,
        available: attachment.status !== 'failed',
      }))}
      copy={{
        label: t('ask.teacherImages.label'),
        loading: t('ask.teacherImages.loading'),
        failed: t('ask.teacherImages.failed'),
        unavailable: t('ask.teacherImages.unavailable'),
        retry: t('ask.teacherImages.retry'),
        alt: (name) => t('ask.teacherImages.alt', { teacher, name }),
        open: (name) => t('ask.teacherImages.open', { name }),
        retryNamed: (name) => t('ask.teacherImages.retryNamed', { name }),
      }}
    />
  )
}
