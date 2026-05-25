import { httpClient } from '@/services/api/httpClient'
import type { TutorCredentialUpload } from '@/types/onboarding'

export async function uploadTutorCredential(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await httpClient.post<TutorCredentialUpload>(
    '/files/tutor-credentials',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}
