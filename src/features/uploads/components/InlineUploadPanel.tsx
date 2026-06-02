import { useState } from 'react'
import { Camera, MessageCircleQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AttachmentPreviewList } from '@/features/uploads/components/AttachmentPreviewList'
import { PhotoCaptureButton } from '@/features/uploads/components/PhotoCaptureButton'
import { UploadButton } from '@/features/uploads/components/UploadButton'
import { UploadErrorMessage } from '@/features/uploads/components/UploadErrorMessage'
import { useUploadAttachments } from '@/features/uploads/hooks/useUploadAttachments'
import type { UploadAttachment, UploadContext, UploadSourceOptions } from '@/features/uploads/types/uploads'
import { getUploadConfigForContext } from '@/features/uploads/utils/uploadLimits'

type InlineUploadPanelProps = {
  context: UploadContext
  title?: string
  description?: string
  sourceOptions?: UploadSourceOptions
  compact?: boolean
  onAskLearningAssistant?: (attachments: UploadAttachment[]) => void
}

export function InlineUploadPanel({
  context,
  title,
  description,
  sourceOptions,
  compact = false,
  onAskLearningAssistant,
}: InlineUploadPanelProps) {
  const { t } = useTranslation('uploads')
  const [hasInteracted, setHasInteracted] = useState(false)
  const config = getUploadConfigForContext(context)
  const {
    attachments,
    errors,
    isUploading,
    addFiles,
    removeAttachment,
    retryAttachment,
  } = useUploadAttachments({ context, config, sourceOptions })
  const uploadedAttachments = attachments.filter((attachment) => attachment.status === 'uploaded')

  async function addAndReveal(files: File[]) {
    setHasInteracted(true)
    await addFiles(files)
  }

  return (
    <section className="rounded-lg border border-primary/15 bg-card/95 p-5 shadow-[var(--platform-shadow-soft)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="brand-section-kicker mt-4">{t('learning.uploadKicker', 'Upload a Question')}</p>
          <h2 className={compact ? 'mt-2 text-xl font-semibold' : 'mt-2 text-2xl font-semibold'}>
            {title ?? t('learning.uploadOwnQuestionTitle', 'Bring your own schoolwork')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description ?? t('learning.uploadOwnQuestionDescription', 'Take a photo or attach a PDF from schoolwork. The Learning Assistant can help you understand it step by step.')}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t('privacy.learningOnly', 'Please upload learning materials only. Do not upload personal documents.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <PhotoCaptureButton onPhotoSelected={(file) => void addAndReveal([file])} disabled={isUploading} />
          <UploadButton onFilesSelected={(files) => void addAndReveal(files)} disabled={isUploading} />
        </div>
      </div>

      {(hasInteracted || attachments.length > 0 || errors.length > 0) && (
        <div className="mt-4 space-y-4">
          <UploadErrorMessage errors={errors} />
          <AttachmentPreviewList
            attachments={attachments}
            onRemove={removeAttachment}
            onRetry={(attachmentId) => void retryAttachment(attachmentId)}
            compact
          />
          {uploadedAttachments.length > 0 && onAskLearningAssistant && (
            <Button type="button" onClick={() => onAskLearningAssistant(uploadedAttachments)}>
              <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
              {t('actions.askLearningAssistant', 'Ask Learning Assistant')}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
