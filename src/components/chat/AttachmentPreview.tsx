import { FileText, Image, X } from 'lucide-react'
import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UploadedFile } from '@/types/file'

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  return mimeType === 'application/pdf' ? FileText : Image
}

export function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: UploadedFile
  onRemove?: (attachmentId: string) => void
}) {
  const Icon = getFileIcon(attachment.mimeType)
  const isFailed = attachment.status === 'failed'

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-xs',
        isFailed && 'border-destructive/40',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{attachment.filename}</div>
        <div
          className={cn(
            'mt-0.5 text-[11px] text-muted-foreground',
            isFailed && 'text-destructive',
          )}
        >
          {attachment.mimeType} · {formatFileSize(attachment.sizeBytes)} ·{' '}
          <SafeStatusLabel kind="file" value={attachment.status} />
        </div>
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label={`Remove ${attachment.filename}`}
          onClick={() => onRemove(attachment.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
