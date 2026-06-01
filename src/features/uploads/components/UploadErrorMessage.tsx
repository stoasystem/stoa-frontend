import type { UploadValidationError } from '@/features/uploads/types/uploads'

export function UploadErrorMessage({
  errors,
}: {
  errors: UploadValidationError[]
}) {
  if (errors.length === 0) return null

  return (
    <div role="alert" aria-live="assertive" className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {errors.map((error) => (
        <p key={`${error.fileName}-${error.code}`}>
          <span className="font-medium">{error.fileName}:</span> {error.message}
        </p>
      ))}
    </div>
  )
}
