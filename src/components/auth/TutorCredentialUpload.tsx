import { FileCheck2, Upload } from 'lucide-react'
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
  const uploadMutation = useTutorCredentialUploadMutation()

  return (
    <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium text-foreground">Diploma or teaching certificate</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            PDF, PNG, or JPEG. Maximum 10 MB. Demo uploads are marked pending review.
          </p>
        </div>
        <Button type="button" variant="outline" className="relative overflow-hidden">
          <Upload className="h-4 w-4" />
          Upload file
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
                onError('Only PDF, PNG, and JPEG files are supported.')
                return
              }
              if (file.size > maxSizeBytes) {
                onError('Credential file must be 10 MB or smaller.')
                return
              }
              uploadMutation.mutate(file, {
                onSuccess: onUploaded,
                onError: () => onError('Credential upload failed.'),
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
              <span className="text-xs text-muted-foreground">uploaded</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
