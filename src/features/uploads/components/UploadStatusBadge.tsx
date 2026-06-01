import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { UploadStatus } from '@/features/uploads/types/uploads'

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  const { t } = useTranslation('uploads')

  if (status === 'uploading' || status === 'validating') {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {t(`status.${status}`, status)}
      </Badge>
    )
  }

  if (status === 'failed' || status === 'rejected') {
    return (
      <Badge variant="outline" className="gap-1.5 border-destructive/40 text-destructive">
        <XCircle className="h-3 w-3" aria-hidden="true" />
        {t(`status.${status}`, status)}
      </Badge>
    )
  }

  if (status === 'uploaded') {
    return (
      <Badge variant="secondary" className="gap-1.5 border-primary/15 bg-primary/10 text-primary">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        {t('status.uploaded', 'Uploaded')}
      </Badge>
    )
  }

  return <Badge variant="outline">{t('status.idle', 'Ready')}</Badge>
}
