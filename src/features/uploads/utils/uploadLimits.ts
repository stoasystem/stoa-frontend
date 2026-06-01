import type { UploadConfig, UploadContext } from '@/features/uploads/types/uploads'

export const acceptedLearningUploadMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export const defaultUploadConfig: UploadConfig = {
  acceptedMimeTypes: acceptedLearningUploadMimeTypes,
  maxFileSizeMb: 10,
  maxFiles: 5,
  allowMultiple: true,
}

export const chatUploadConfig: UploadConfig = {
  ...defaultUploadConfig,
  maxFiles: 3,
}

export const questionSessionUploadConfig: UploadConfig = {
  ...defaultUploadConfig,
  maxFiles: 2,
}

export function getUploadConfigForContext(context: UploadContext): UploadConfig {
  if (context === 'chat') return chatUploadConfig
  if (context === 'question_session') return questionSessionUploadConfig
  return defaultUploadConfig
}

export function getAcceptedUploadInputValue(acceptedMimeTypes = acceptedLearningUploadMimeTypes) {
  return acceptedMimeTypes.join(',')
}
