import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFileUploadMutation } from '@/hooks/files/useFileUploadMutation'
import type { UploadedFile } from '@/types/file'

const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 3

function validateFile(file: File, pendingCount: number) {
  if (pendingCount >= MAX_ATTACHMENTS) {
    return 'You can upload at most 3 files at once.'
  }

  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return 'Only PNG, JPEG, and PDF files are supported.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File size must be under 10 MB.'
  }

  return null
}

export function FileUploadButton({
  conversationId,
  pendingAttachmentCount,
  disabled = false,
  onUploadComplete,
  onUploadError,
}: {
  conversationId?: string
  pendingAttachmentCount: number
  disabled?: boolean
  onUploadComplete: (file: UploadedFile) => void
  onUploadError: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const uploadMutation = useFileUploadMutation()

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    for (const [index, file] of files.entries()) {
      const validationError = validateFile(file, pendingAttachmentCount + index)

      if (validationError) {
        onUploadError(validationError)
        toast.error(validationError)
        return
      }

      try {
        const uploadedFile = await uploadMutation.mutateAsync({
          file,
          conversationId,
        })
        onUploadComplete(uploadedFile)
      } catch (error) {
        onUploadError(error instanceof Error ? error.message : 'Failed to upload file.')
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES.join(',')}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Upload homework file"
        disabled={disabled || uploadMutation.isPending}
        onClick={() => {
          inputRef.current?.click()
        }}
      >
        <Upload className="h-4 w-4" />
      </Button>
    </>
  )
}
