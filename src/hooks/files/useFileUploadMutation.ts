import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { uploadFile } from '@/services/files/fileApi'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function useFileUploadMutation() {
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: (file) => {
      trackEvent('file_uploaded', {
        fileId: file.id,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      })
      toast.success('File uploaded')
    },
    onError: () => {
      toast.error('File upload failed')
    },
  })
}
