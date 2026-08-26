import { type FormEvent, useState } from 'react'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { StopGeneratingButton } from '@/components/chat/StopGeneratingButton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AttachmentPreviewList } from '@/features/uploads/components/AttachmentPreviewList'
import { PhotoCaptureButton } from '@/features/uploads/components/PhotoCaptureButton'
import { UploadButton } from '@/features/uploads/components/UploadButton'
import { UploadErrorMessage } from '@/features/uploads/components/UploadErrorMessage'
import { useUploadAttachments } from '@/features/uploads/hooks/useUploadAttachments'
import { uploadAttachmentToUploadedFile } from '@/features/uploads/utils/uploadAdapters'
import { chatUploadConfig } from '@/features/uploads/utils/uploadLimits'
import { useStudentEntitlementQuery } from '@/hooks/student/useStudentEntitlementQuery'
import { createChatInputSchema } from '@/lib/validation'
import type { UploadedFile } from '@/types/file'

type ChatInputProps = {
  onSendMessage: (payload: {
    content: string
    attachmentIds?: string[]
    attachments?: UploadedFile[]
  }) => void
  onStopStreaming?: () => void
  isStreaming?: boolean
  disabled?: boolean
  conversationId?: string
}

export function ChatInput({
  onSendMessage,
  onStopStreaming,
  isStreaming = false,
  disabled = false,
  conversationId,
}: ChatInputProps) {
  const { t } = useTranslation(['chat', 'common', 'uploads'])
  const [value, setValue] = useState('')
  const entitlementQuery = useStudentEntitlementQuery()
  const chatLocked = entitlementQuery.data?.newUsageAllowed === false
  const chatInputSchema = createChatInputSchema(t)
  const {
    attachments,
    errors,
    isUploading,
    addFiles,
    removeAttachment,
    retryAttachment,
    clearAttachments,
  } = useUploadAttachments({
    context: 'chat',
    config: chatUploadConfig,
    sourceOptions: {
      conversationId,
      sourcePage: '/chat',
    },
  })
  const uploadedAttachments = attachments.filter((attachment) => attachment.status === 'uploaded')
  // Upload limits are enforced when the upload is issued, not gated here.
  const uploadLockedReason = undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = value.trim()
    if (disabled || isStreaming || chatLocked) {
      if (chatLocked) toast.error(t('chat:quotaReached'))
      return
    }

    if (uploadLockedReason && attachments.length === 0) {
      toast.error(uploadLockedReason)
      return
    }

    if (isUploading) {
      toast.error(t('uploads:errors.waitForUpload', 'Please wait for the upload to finish.'))
      return
    }

    if (uploadedAttachments.length === 0) {
      const result = chatInputSchema.safeParse({ content: trimmed })
      if (!result.success) {
        toast.error(result.error.flatten().fieldErrors.content?.[0] ?? t('chat:emptyMessage'))
        return
      }
    }

    const messageContent = trimmed || t(
      'uploads:chat.defaultAttachmentPrompt',
      'I uploaded a schoolwork question. Please help me understand it step by step.',
    )
    const chatAttachments = uploadedAttachments.map(uploadAttachmentToUploadedFile)

    onSendMessage({
      content: messageContent,
      attachmentIds: chatAttachments.map((attachment) => attachment.id),
      attachments: chatAttachments,
    })
    setValue('')
    clearAttachments()
  }

  return (
    <form onSubmit={handleSubmit} className="chat-panel border-t px-4 py-4 md:px-6">
      <div className="mx-auto max-w-3xl space-y-3">
        <AttachmentPreviewList
          attachments={attachments}
          onRemove={removeAttachment}
          onRetry={(attachmentId) => void retryAttachment(attachmentId)}
          compact
        />
        <UploadErrorMessage errors={errors} />
        <div className="flex gap-3">
          <UploadButton
            iconOnly
            size="icon"
            disabled={disabled || isStreaming || !conversationId || isUploading}
            onFilesSelected={(files) => {
              if (uploadLockedReason) {
                toast.error(uploadLockedReason)
                return
              }
              void addFiles(files)
            }}
          />
          <PhotoCaptureButton
            iconOnly
            size="icon"
            disabled={disabled || isStreaming || !conversationId || isUploading}
            onPhotoSelected={(file) => {
              if (uploadLockedReason) {
                toast.error(uploadLockedReason)
                return
              }
              void addFiles([file])
            }}
          />
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t('chat:placeholder')}
            className="min-h-12 resize-none bg-card"
            disabled={disabled || isStreaming || chatLocked}
            aria-label={t('chat:inputLabel')}
          />
          {isStreaming && onStopStreaming ? (
            <StopGeneratingButton onStop={onStopStreaming} />
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label={t('common:actions.send')}
              disabled={disabled || isStreaming || chatLocked || isUploading || (!value.trim() && uploadedAttachments.length === 0)}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
