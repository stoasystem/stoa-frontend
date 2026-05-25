import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { uploadTutorCredential } from '@/services/files/tutorCredentialApi'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function useTutorCredentialUploadMutation() {
  return useMutation({
    mutationFn: uploadTutorCredential,
    onSuccess: (file) => {
      trackEvent('tutor_credential_uploaded', {
        fileId: file.id,
        filename: file.filename,
      })
      toast.success('Credential uploaded')
    },
    onError: () => {
      toast.error('Credential upload failed')
    },
  })
}
