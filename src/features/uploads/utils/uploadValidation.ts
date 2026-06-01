import type { UploadConfig, UploadValidationError } from '@/features/uploads/types/uploads'
import { megabytesToBytes } from '@/features/uploads/utils/fileSize'
import { defaultUploadConfig } from '@/features/uploads/utils/uploadLimits'

function createError(fileName: string, code: UploadValidationError['code'], message: string): UploadValidationError {
  return { fileName, code, message }
}

export function validateUploadFiles(
  files: File[],
  config: UploadConfig = defaultUploadConfig,
  currentCount = 0,
) {
  const acceptedFiles: File[] = []
  const errors: UploadValidationError[] = []
  const maxSizeBytes = megabytesToBytes(config.maxFileSizeMb)

  files.forEach((file) => {
    if (currentCount + acceptedFiles.length >= config.maxFiles) {
      errors.push(createError(
        file.name,
        'too_many_files',
        `You can upload up to ${config.maxFiles} files.`,
      ))
      return
    }

    if (file.size === 0) {
      errors.push(createError(file.name, 'empty_file', 'This file appears to be empty.'))
      return
    }

    if (!config.acceptedMimeTypes.includes(file.type)) {
      errors.push(createError(
        file.name,
        'unsupported_type',
        'This file type is not supported. Please upload JPG, PNG, WEBP, or PDF.',
      ))
      return
    }

    if (file.size > maxSizeBytes) {
      errors.push(createError(
        file.name,
        'file_too_large',
        `This file is too large. Maximum file size is ${config.maxFileSizeMb} MB.`,
      ))
      return
    }

    acceptedFiles.push(file)
  })

  return { acceptedFiles, errors }
}
