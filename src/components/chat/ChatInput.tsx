import { type FormEvent, useState } from 'react'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AttachmentPreview } from '@/components/chat/AttachmentPreview'
import { FileUploadButton } from '@/components/chat/FileUploadButton'
import { StopGeneratingButton } from '@/components/chat/StopGeneratingButton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useFeatureAccessQuery } from '@/hooks/billing/useFeatureAccessQuery'
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
  const { t } = useTranslation(['chat', 'common'])
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const featureAccessQuery = useFeatureAccessQuery()
  const access = featureAccessQuery.data
  const chatLocked = access?.canUseChat === false
  const chatInputSchema = createChatInputSchema(t)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = value.trim()
    if (disabled || isStreaming || chatLocked) {
      if (chatLocked) toast.error(access?.reason?.chat ?? t('chat:quotaReached'))
      return
    }

    if (attachments.length === 0) {
      const result = chatInputSchema.safeParse({ content: trimmed })
      if (!result.success) {
        toast.error(result.error.flatten().fieldErrors.content?.[0] ?? t('chat:emptyMessage'))
        return
      }
    }

    onSendMessage({
      content: trimmed,
      attachmentIds: attachments.map((attachment) => attachment.id),
      attachments,
    })
    setValue('')
    setAttachments([])
    setUploadError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background px-4 py-4 md:px-6">
      <div className="mx-auto max-w-3xl space-y-3">
        {attachments.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                onRemove={(attachmentId) => {
                  setAttachments((current) =>
                    current.filter((item) => item.id !== attachmentId),
                  )
                }}
              />
            ))}
          </div>
        )}
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        <div className="flex gap-3">
          <FileUploadButton
            conversationId={conversationId}
            pendingAttachmentCount={attachments.length}
            disabled={disabled || isStreaming || !conversationId}
            lockedReason={
              access?.canUploadFiles === false
                ? access.reason?.fileUploads ?? t('chat:fileQuotaReached')
                : undefined
            }
            onUploadComplete={(file) => {
              setAttachments((current) => [...current, file])
              setUploadError(null)
            }}
            onUploadError={setUploadError}
          />
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t('chat:placeholder')}
            className="min-h-12 resize-none"
            disabled={disabled || isStreaming || chatLocked}
          />
          {isStreaming && onStopStreaming ? (
            <StopGeneratingButton onStop={onStopStreaming} />
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label={t('common:actions.send')}
              disabled={disabled || isStreaming || chatLocked || (!value.trim() && attachments.length === 0)}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
