import { useMutation } from '@tanstack/react-query'
import { uploadFile } from '@/services/files/fileApi'

export function useFileUploadMutation() {
  return useMutation({
    mutationFn: uploadFile,
  })
}
