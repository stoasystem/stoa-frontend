import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AttachmentPreviewList } from '@/features/uploads/components/AttachmentPreviewList'
import { PhotoCaptureButton } from '@/features/uploads/components/PhotoCaptureButton'
import { UploadButton } from '@/features/uploads/components/UploadButton'
import { UploadDropzone } from '@/features/uploads/components/UploadDropzone'
import { UploadErrorMessage } from '@/features/uploads/components/UploadErrorMessage'
import { useUploadAttachments } from '@/features/uploads/hooks/useUploadAttachments'
import type { UploadAttachment, UploadContext, UploadSourceOptions } from '@/features/uploads/types/uploads'
import { getUploadConfigForContext } from '@/features/uploads/utils/uploadLimits'

type UploadModalProps = {
  open: boolean
  title?: string
  description?: string
  context: UploadContext
  sourceOptions?: UploadSourceOptions
  onOpenChange: (open: boolean) => void
  onComplete?: (attachments: UploadAttachment[]) => void
}

export function UploadModal({
  open,
  title,
  description,
  context,
  sourceOptions,
  onOpenChange,
  onComplete,
}: UploadModalProps) {
  const { t } = useTranslation('uploads')
  const config = getUploadConfigForContext(context)
  const {
    attachments,
    errors,
    isUploading,
    addFiles,
    removeAttachment,
    retryAttachment,
    clearAttachments,
  } = useUploadAttachments({ context, config, sourceOptions })
  const hasUploadedAttachments = attachments.some((attachment) => attachment.status === 'uploaded')

  function closeModal(openState: boolean) {
    onOpenChange(openState)
    if (!openState) clearAttachments()
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title ?? t('modal.title', 'Upload a question')}</DialogTitle>
          <DialogDescription>
            {description ?? t('modal.description', 'Take a photo or attach a PDF, then ask the Learning Assistant.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="rounded-md border border-primary/15 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
            {t('privacy.learningOnly', 'Please upload learning materials only. Do not upload personal documents.')}
          </p>
          <div className="grid gap-2 rounded-md border bg-[hsl(var(--platform-surface-app))] p-3 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
            <p>{t('dropzone.description', 'Supported formats: JPG, PNG, WEBP, PDF. Maximum file size: 10 MB.')}</p>
            <p>{t('errors.tooManyFiles', { count: config.maxFiles, defaultValue: 'You can upload up to {{count}} files at a time.' })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PhotoCaptureButton onPhotoSelected={(file) => void addFiles([file])} disabled={isUploading} />
            <UploadButton onFilesSelected={(files) => void addFiles(files)} disabled={isUploading} />
          </div>
          <UploadDropzone
            accept={config.acceptedMimeTypes}
            maxFiles={config.maxFiles}
            maxFileSizeMb={config.maxFileSizeMb}
            currentFileCount={attachments.length}
            disabled={isUploading}
            onFilesAccepted={(files) => void addFiles(files)}
            onFilesRejected={() => undefined}
          />
          <UploadErrorMessage errors={errors} />
          <AttachmentPreviewList
            attachments={attachments}
            onRemove={removeAttachment}
            onRetry={(attachmentId) => void retryAttachment(attachmentId)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeModal(false)}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            disabled={!hasUploadedAttachments || isUploading}
            onClick={() => {
              onComplete?.(attachments.filter((attachment) => attachment.status === 'uploaded'))
              closeModal(false)
            }}
          >
            {t('actions.askLearningAssistant', 'Ask Learning Assistant')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
