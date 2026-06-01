import { allowDemoFallback } from '@/lib/env'
import { uploadFile } from '@/services/files/fileApi'
import type { UploadAttachment, UploadContext, UploadSourceOptions } from '@/features/uploads/types/uploads'
import { getUploadFileKind } from '@/features/uploads/utils/fileType'

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function createLocalAttachment(
  file: File,
  context: UploadContext,
  options: UploadSourceOptions = {},
): UploadAttachment {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    kind: getUploadFileKind(file.type),
    status: 'uploaded',
    createdAt: new Date().toISOString(),
    context,
    sourcePage: options.sourcePage,
    sourceEntityId: options.sourceEntityId,
  }
}

export async function uploadFiles(
  files: File[],
  context: UploadContext,
  options: UploadSourceOptions = {},
): Promise<UploadAttachment[]> {
  const uploaded: UploadAttachment[] = []

  for (const file of files) {
    if (file.name.toLowerCase().includes('fail-upload')) {
      await delay(300)
      throw new Error('The upload failed. Please try again.')
    }

    try {
      if (context === 'chat') {
        const result = await uploadFile({
          file,
          conversationId: options.conversationId,
        })

        uploaded.push({
          id: result.id,
          fileName: result.filename,
          fileSize: result.sizeBytes,
          mimeType: result.mimeType,
          kind: getUploadFileKind(result.mimeType),
          status: result.status === 'failed' ? 'failed' : 'uploaded',
          createdAt: result.createdAt,
          context,
          sourcePage: options.sourcePage,
          sourceEntityId: options.sourceEntityId,
        })
        continue
      }
    } catch (error) {
      if (!allowDemoFallback) throw error
    }

    await delay(400)
    uploaded.push(createLocalAttachment(file, context, options))
  }

  return uploaded
}

export async function retryUpload(attachment: UploadAttachment): Promise<UploadAttachment> {
  await delay(350)

  return {
    ...attachment,
    status: 'uploaded',
    errorMessage: undefined,
  }
}

export async function removeUploadedAttachment(attachmentId: string): Promise<void> {
  void attachmentId
  await delay(100)
}
