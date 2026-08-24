import { httpClient } from '@/services/api/httpClient'
import type {
  CompleteUploadResponse,
  UploadIntentResponse,
  UploadPurpose,
  UploadedFile,
} from '@/types/file'

export class UploadRejectedError extends Error {
  readonly reason: 'too_large' | 'unsupported_type'

  constructor(reason: 'too_large' | 'unsupported_type', message: string) {
    super(message)
    this.name = 'UploadRejectedError'
    this.reason = reason
  }
}

async function createUploadIntent(file: File, purpose: UploadPurpose) {
  const response = await httpClient.post<UploadIntentResponse>('/files/intents', {
    purpose,
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  })
  return response.data
}

async function putChunk(uploadId: string, partNumber: number, chunk: Blob) {
  await httpClient.put(`/files/${uploadId}/chunks/${partNumber}`, chunk, {
    headers: { 'Content-Type': 'application/octet-stream' },
  })
}

async function completeUpload(uploadId: string, partCount: number) {
  const response = await httpClient.post<CompleteUploadResponse>(
    `/files/${uploadId}/complete`,
    { partCount },
  )
  return response.data
}

/** Upload one file through the intent, chunk and complete steps the API defines. */
export async function uploadFile({
  file,
  purpose = 'conversation_attachment',
}: {
  file: File
  purpose?: UploadPurpose
}): Promise<UploadedFile> {
  const intent = await createUploadIntent(file, purpose)

  if (file.size > intent.maxBytes) {
    throw new UploadRejectedError('too_large', `File exceeds ${intent.maxBytes} bytes.`)
  }
  if (intent.acceptedTypes.length > 0 && !intent.acceptedTypes.includes(file.type)) {
    throw new UploadRejectedError('unsupported_type', `${file.type || 'unknown'} is not accepted.`)
  }

  const partCount = Math.max(1, Math.ceil(file.size / intent.chunkBytes))
  for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
    const start = (partNumber - 1) * intent.chunkBytes
    await putChunk(intent.uploadId, partNumber, file.slice(start, start + intent.chunkBytes))
  }

  const completed = await completeUpload(intent.uploadId, partCount)
  const attachment = completed.attachment
  if (!attachment) {
    throw new Error(`Upload finished with status ${completed.status} and no attachment.`)
  }

  return {
    id: attachment.attachmentId,
    uploadId: completed.uploadId,
    filename: attachment.filename,
    mimeType: attachment.mediaType,
    sizeBytes: attachment.sizeBytes,
    status: attachment.status === 'active' ? 'uploaded' : 'failed',
    createdAt: attachment.createdAt,
  }
}

export async function getUploadedFile(attachmentId: string) {
  const response = await httpClient.get<UploadedFile>(`/files/attachments/${attachmentId}`)
  return response.data
}

export async function deleteUploadedFile(attachmentId: string) {
  await httpClient.delete(`/files/attachments/${attachmentId}`)
}
