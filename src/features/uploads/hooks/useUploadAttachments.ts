import { useCallback, useMemo, useState } from 'react'
import type {
  UploadAttachment,
  UploadConfig,
  UploadContext,
  UploadSourceOptions,
  UploadValidationError,
} from '@/features/uploads/types/uploads'
import { retryUpload, uploadFiles } from '@/features/uploads/services/uploadService'
import { getUploadFileKind } from '@/features/uploads/utils/fileType'
import { defaultUploadConfig } from '@/features/uploads/utils/uploadLimits'
import { validateUploadFiles } from '@/features/uploads/utils/uploadValidation'
import { useObjectUrlPreview } from '@/features/uploads/hooks/useObjectUrlPreview'

type UseUploadAttachmentsOptions = {
  context: UploadContext
  config?: UploadConfig
  sourceOptions?: UploadSourceOptions
}

function createPendingAttachment(
  file: File,
  context: UploadContext,
  previewUrl: string | undefined,
  sourceOptions: UploadSourceOptions = {},
): UploadAttachment {
  return {
    id: `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    kind: getUploadFileKind(file.type),
    status: 'uploading',
    previewUrl,
    createdAt: new Date().toISOString(),
    context,
    sourcePage: sourceOptions.sourcePage,
    sourceEntityId: sourceOptions.sourceEntityId,
  }
}

export function useUploadAttachments({
  context,
  config = defaultUploadConfig,
  sourceOptions,
}: UseUploadAttachmentsOptions) {
  const [attachments, setAttachments] = useState<UploadAttachment[]>([])
  const [errors, setErrors] = useState<UploadValidationError[]>([])
  const { createPreviewUrl, revokePreviewUrl, revokeAllPreviewUrls } = useObjectUrlPreview()

  const isUploading = useMemo(
    () => attachments.some((attachment) => attachment.status === 'uploading' || attachment.status === 'validating'),
    [attachments],
  )

  const addFiles = useCallback(async (files: File[]) => {
    const { acceptedFiles, errors: validationErrors } = validateUploadFiles(files, config, attachments.length)
    setErrors(validationErrors)

    if (acceptedFiles.length === 0) return

    const pendingAttachments = acceptedFiles.map((file) =>
      createPendingAttachment(file, context, createPreviewUrl(file), sourceOptions),
    )

    setAttachments((current) => [...current, ...pendingAttachments])

    try {
      const uploadedAttachments = await uploadFiles(acceptedFiles, context, sourceOptions)
      setAttachments((current) =>
        current.map((attachment) => {
          const pendingIndex = pendingAttachments.findIndex((pending) => pending.id === attachment.id)
          if (pendingIndex === -1) return attachment

          return {
            ...uploadedAttachments[pendingIndex],
            previewUrl: attachment.previewUrl,
          }
        }),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The upload failed. Please try again.'
      setAttachments((current) =>
        current.map((attachment) =>
          pendingAttachments.some((pending) => pending.id === attachment.id)
            ? { ...attachment, status: 'failed', errorMessage: message }
            : attachment,
        ),
      )
      setErrors([{ fileName: acceptedFiles[0]?.name ?? 'File', code: 'unknown', message }])
    }
  }, [attachments.length, config, context, createPreviewUrl, sourceOptions])

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((current) => {
      const attachment = current.find((item) => item.id === attachmentId)
      revokePreviewUrl(attachment?.previewUrl)
      return current.filter((item) => item.id !== attachmentId)
    })
  }, [revokePreviewUrl])

  const retryAttachment = useCallback(async (attachmentId: string) => {
    const attachment = attachments.find((item) => item.id === attachmentId)
    if (!attachment) return

    setAttachments((current) =>
      current.map((item) =>
        item.id === attachmentId ? { ...item, status: 'uploading', errorMessage: undefined } : item,
      ),
    )

    try {
      const uploaded = await retryUpload(attachment)
      setAttachments((current) =>
        current.map((item) =>
          item.id === attachmentId ? { ...uploaded, previewUrl: item.previewUrl } : item,
        ),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The upload failed. Please try again.'
      setAttachments((current) =>
        current.map((item) =>
          item.id === attachmentId ? { ...item, status: 'failed', errorMessage: message } : item,
        ),
      )
    }
  }, [attachments])

  const clearAttachments = useCallback(() => {
    revokeAllPreviewUrls()
    setAttachments([])
    setErrors([])
  }, [revokeAllPreviewUrls])

  return {
    attachments,
    errors,
    isUploading,
    addFiles,
    removeAttachment,
    retryAttachment,
    clearAttachments,
  }
}
