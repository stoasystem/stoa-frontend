import type { UploadAttachment } from '@/features/uploads/types/uploads'

export const UPLOAD_HANDOFF_STORAGE_KEY = 'stoa.pendingLearningAssistantUpload'

export type UploadChatHandoff = {
  source: 'question-bank-upload' | 'question-session-upload' | 'practice-upload'
  title: string
  description: string
  prompt: string
  returnTo?: string
  sessionId?: string
  questionId?: string
  attachments: UploadAttachment[]
}

export type UploadChatLocationState = {
  uploadContext?: UploadChatHandoff
}

export function saveUploadHandoff(uploadContext: UploadChatHandoff) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(UPLOAD_HANDOFF_STORAGE_KEY, JSON.stringify(uploadContext))
}

export function readUploadHandoff() {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(UPLOAD_HANDOFF_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as UploadChatHandoff
  } catch {
    return null
  }
}

export function clearUploadHandoff() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(UPLOAD_HANDOFF_STORAGE_KEY)
}
