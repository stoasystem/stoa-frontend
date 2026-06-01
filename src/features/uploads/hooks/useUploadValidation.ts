import type { UploadConfig } from '@/features/uploads/types/uploads'
import { defaultUploadConfig } from '@/features/uploads/utils/uploadLimits'
import { validateUploadFiles } from '@/features/uploads/utils/uploadValidation'

export function useUploadValidation(config: UploadConfig = defaultUploadConfig) {
  return {
    validateFiles: (files: File[], currentCount = 0) => validateUploadFiles(files, config, currentCount),
  }
}
