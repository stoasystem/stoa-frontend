import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { UploadButton } from '@/features/uploads/components/UploadButton'
import type { UploadValidationError } from '@/features/uploads/types/uploads'
import { validateUploadFiles } from '@/features/uploads/utils/uploadValidation'
import { defaultUploadConfig, getAcceptedUploadInputValue } from '@/features/uploads/utils/uploadLimits'

type UploadDropzoneProps = {
  accept?: string[]
  maxFiles?: number
  maxFileSizeMb?: number
  disabled?: boolean
  currentFileCount?: number
  onFilesAccepted: (files: File[]) => void
  onFilesRejected?: (errors: UploadValidationError[]) => void
}

export function UploadDropzone({
  accept = defaultUploadConfig.acceptedMimeTypes,
  maxFiles = defaultUploadConfig.maxFiles,
  maxFileSizeMb = defaultUploadConfig.maxFileSizeMb,
  disabled = false,
  currentFileCount = 0,
  onFilesAccepted,
  onFilesRejected,
}: UploadDropzoneProps) {
  const { t } = useTranslation('uploads')
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(files: File[]) {
    const result = validateUploadFiles(files, {
      acceptedMimeTypes: accept,
      maxFiles,
      maxFileSizeMb,
      allowMultiple: true,
    }, currentFileCount)

    if (result.errors.length > 0) onFilesRejected?.(result.errors)
    if (result.acceptedFiles.length > 0) onFilesAccepted(result.acceptedFiles)
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-dashed bg-[hsl(var(--platform-surface-app))] p-5 text-center transition-colors',
        isDragging && 'border-primary bg-primary/5',
        disabled && 'opacity-60',
      )}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault()
        setIsDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        if (disabled) return
        handleFiles(Array.from(event.dataTransfer.files))
      }}
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-card text-primary">
        <UploadCloud className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold">{t('dropzone.title', 'Drag and drop files here')}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {t('dropzone.description', 'Supported formats: JPG, PNG, WEBP, PDF.')}
      </p>
      <div className="mt-4 flex justify-center">
        <UploadButton
          label={t('dropzone.browse', 'Browse files')}
          accept={getAcceptedUploadInputValue(accept)}
          disabled={disabled}
          onFilesSelected={handleFiles}
        />
      </div>
    </div>
  )
}
