// The upload hand-off that carried an attachment into the assistant went with
// the online classroom (2026-10-09); nothing writes this key any more. Sign-out
// still clears it, because a tab that stored it before the deletion would
// otherwise keep it for the next account on this device.
export const UPLOAD_HANDOFF_STORAGE_KEY = 'stoa.pendingLearningAssistantUpload'

export function clearUploadHandoff() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(UPLOAD_HANDOFF_STORAGE_KEY)
}
