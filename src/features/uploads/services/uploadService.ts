import { deleteUploadedFile, uploadFile } from '@/services/files/fileApi'
import type { UploadPurpose } from '@/types/file'
import type {
  UploadAttachment,
  UploadContext,
  UploadSourceOptions,
} from '@/features/uploads/types/uploads'
import { getUploadFileKind } from '@/features/uploads/utils/fileType'

// A photographed exercise belongs to the question lane; everything else the API
// treats as a conversation attachment.
const QUESTION_CONTEXTS: ReadonlySet<UploadContext> = new Set([
  'question_bank',
  'question_session',
  'practice_path',
])

function purposeFor(context: UploadContext): UploadPurpose {
  return QUESTION_CONTEXTS.has(context) ? 'question_image' : 'conversation_attachment'
}

async function upload(
  file: File,
  context: UploadContext,
  options: UploadSourceOptions,
): Promise<UploadAttachment> {
  const result = await uploadFile({ file, purpose: purposeFor(context) })
  return {
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
  }
}

export async function uploadFiles(
  files: File[],
  context: UploadContext,
  options: UploadSourceOptions = {},
): Promise<UploadAttachment[]> {
  const uploaded: UploadAttachment[] = []
  for (const file of files) {
    uploaded.push(await upload(file, context, options))
  }
  return uploaded
}

export async function retryUpload(attachment: UploadAttachment): Promise<UploadAttachment> {
  // The browser cannot re-read a file it no longer holds, so a retry has to come
  // from the picker again rather than silently reporting success.
  throw new Error(`Select ${attachment.fileName} again to retry the upload.`)
}

export async function removeUploadedAttachment(attachmentId: string): Promise<void> {
  await deleteUploadedFile(attachmentId)
}
