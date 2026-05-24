import { httpClient } from '@/services/api/httpClient'
import type { UploadedFile } from '@/types/file'

export async function uploadFile({
  file,
  conversationId,
}: {
  file: File
  conversationId?: string
}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('purpose', 'homework_question')

  if (conversationId) {
    formData.append('conversationId', conversationId)
  }

  const response = await httpClient.post<UploadedFile>('/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function getUploadedFile(fileId: string) {
  const response = await httpClient.get<UploadedFile>(`/files/${fileId}`)
  return response.data
}
