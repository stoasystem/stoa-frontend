import { FileCheck2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useTutorCredentialUploadMutation } from '@/hooks/files/useTutorCredentialUploadMutation'
import type { TutorCredentialUpload as TutorCredentialUploadType } from '@/types/onboarding'

const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
const maxSizeBytes = 10 * 1024 * 1024

export function TutorCredentialUpload({
  files,
  onUploaded,
  onError,
}: {
  files: TutorCredentialUploadType[]
  onUploaded: (file: TutorCredentialUploadType) => void
  onError: (message: string) => void
}) {
  const { t } = useTranslation(['auth', 'errors'])
  const uploadMutation = useTutorCredentialUploadMutation()

  return (
    <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium text-foreground">{t('auth:register.uploadCredential')}</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            PDF, PNG, or JPEG. Maximum 10 MB.
          </p>
        </div>
        <Button type="button" variant="outline" className="relative overflow-hidden">
          <Upload className="h-4 w-4" />
          {t('auth:register.uploadCredential')}
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg"
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={uploadMutation.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              if (!allowedTypes.includes(file.type)) {
                onError(t('errors:unsupportedFileType'))
                return
              }
              if (file.size > maxSizeBytes) {
                onError(t('errors:fileTooLarge'))
                return
              }
              uploadMutation.mutate(file, {
                onSuccess: onUploaded,
                onError: () => onError(t('errors:uploadFailed')),
              })
            }}
          />
        </Button>
      </div>
      {files.length > 0 && (
        <div className="mt-4 grid gap-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-2 rounded-md bg-card px-3 py-2 text-sm">
              <FileCheck2 className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span className="min-w-0 flex-1 truncate">{file.filename}</span>
              <span className="text-xs text-muted-foreground">{t('auth:register.pendingReview')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
