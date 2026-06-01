import { useTranslation } from 'react-i18next'
import { AttachmentPreviewCard } from '@/features/uploads/components/AttachmentPreviewCard'
import type { UploadAttachment } from '@/features/uploads/types/uploads'

export function AttachmentPreviewList({
  attachments,
  onRemove,
  onRetry,
  compact = false,
}: {
  attachments: UploadAttachment[]
  onRemove?: (attachmentId: string) => void
  onRetry?: (attachmentId: string) => void
  compact?: boolean
}) {
  const { t } = useTranslation('uploads')

  if (attachments.length === 0) return null

  return (
    <section className="space-y-3" aria-live="polite">
      <h3 className="text-sm font-semibold">{t('preview.attachedFiles', 'Attached files')}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <AttachmentPreviewCard
            key={attachment.id}
            attachment={attachment}
            onRemove={onRemove}
            onRetry={onRetry}
            compact={compact}
          />
        ))}
      </div>
    </section>
  )
}
