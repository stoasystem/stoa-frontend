import { FileText, Image, RotateCcw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UploadStatusBadge } from '@/features/uploads/components/UploadStatusBadge'
import type { UploadAttachment } from '@/features/uploads/types/uploads'
import { formatUploadFileSize } from '@/features/uploads/utils/fileSize'
import { getUploadFileKindLabel } from '@/features/uploads/utils/fileType'

export function AttachmentPreviewCard({
  attachment,
  onRemove,
  onRetry,
  compact = false,
}: {
  attachment: UploadAttachment
  onRemove?: (attachmentId: string) => void
  onRetry?: (attachmentId: string) => void
  compact?: boolean
}) {
  const { t } = useTranslation('uploads')
  const isImage = attachment.kind === 'image' && attachment.previewUrl
  const Icon = attachment.kind === 'image' ? Image : FileText
  const fileKindLabel = t(`preview.${attachment.kind}`, getUploadFileKindLabel(attachment.kind))

  return (
    <article
      className={cn(
        'min-w-0 rounded-lg border bg-card/95 shadow-[var(--platform-shadow-soft)]',
        attachment.status === 'failed' && 'border-destructive/40',
        compact ? 'p-3' : 'p-4',
      )}
      aria-label={`${attachment.fileName}, ${fileKindLabel}`}
    >
      <div className="flex min-w-0 gap-3">
        <div className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-[hsl(var(--platform-surface-app))]',
          compact ? 'h-12 w-12' : 'h-16 w-16',
        )}>
          {isImage ? (
            <img
              src={attachment.previewUrl}
              alt={t('preview.imageAlt', { fileName: attachment.fileName })}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{attachment.fileName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {fileKindLabel} · {formatUploadFileSize(attachment.fileSize)}
              </p>
            </div>
            <UploadStatusBadge status={attachment.status} />
          </div>
          {attachment.errorMessage && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {attachment.errorMessage}
            </p>
          )}
          {(onRetry || onRemove) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachment.status === 'failed' && onRetry && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRetry(attachment.id)}
                  aria-label={t('actions.retryFile', { fileName: attachment.fileName })}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('actions.retry', 'Retry')}
                </Button>
              )}
              {onRemove && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(attachment.id)}
                  aria-label={t('actions.removeFile', { fileName: attachment.fileName })}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('actions.remove', 'Remove')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
