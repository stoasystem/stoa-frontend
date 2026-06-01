export type ClassroomRole =
  | 'student'
  | 'tutor'
  | 'parent_observer'
  | 'admin_observer'

export type ClassroomSessionType =
  | 'quick_help'
  | 'standard_session'
  | 'deep_review'
  | 'instant_video_help'

export type ClassroomSource =
  | 'dashboard'
  | 'scheduled'
  | 'learning_chat'
  | 'teacher_text_help'
  | 'question_bank'
  | 'practice_path'
  | 'uploaded_material'

export type ClassroomStatus =
  | 'scheduled'
  | 'lobby_open'
  | 'waiting_for_tutor'
  | 'waiting_for_student'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'missed'

export type ClassroomLobbyState =
  | 'not_ready'
  | 'ready'
  | 'waiting_for_tutor'
  | 'tutor_ready'
  | 'joining'
  | 'failed_to_join'
  | 'unavailable'
  | 'completed'

export type ClassroomDeviceStatus =
  | 'off'
  | 'on'
  | 'muted'
  | 'unmuted'
  | 'available'
  | 'unavailable'

export type ClassroomSidePanelTab = 'chat' | 'materials' | 'notes' | 'participants'

export type ClassroomLanguage = 'en' | 'de' | 'fr' | 'it'

export type ClassroomContext = {
  sourceConversationId?: string
  sourceQuestionId?: string
  sourceQuestionSetId?: string
  sourcePracticeLessonId?: string
  sourceUploadIds?: string[]
  sourceLabel?: string
  topicLabel?: string
  summary?: string
  studentMessage?: string
}

export type ClassroomMaterial = {
  id: string
  title: string
  type: 'image' | 'pdf' | 'document' | 'link'
  url?: string
  previewUrl?: string
  fileSize?: number
  mimeType?: string
  uploadedByRole: ClassroomRole
  createdAt: string
}

export type ClassroomParticipant = {
  id: string
  role: ClassroomRole
  displayName: string
  subjectLabels?: string[]
  languageLabels?: string[]
  levelLabel?: string
  avatarUrl?: string
  cameraStatus: 'on' | 'off'
  microphoneStatus: 'muted' | 'unmuted'
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
}

export type ClassroomMessage = {
  id: string
  sessionId: string
  senderId: string
  senderRole: ClassroomRole
  senderName: string
  body: string
  createdAt: string
}

export type ClassroomNextStep = {
  id: string
  label: string
  targetType: 'question_set' | 'practice_lesson' | 'chat' | 'custom'
  targetUrl?: string
}

export type ClassroomNotes = {
  summary: string
  keyPoints: string[]
  nextSteps: ClassroomNextStep[]
}

export type ClassroomDeviceState = {
  microphone: 'muted' | 'unmuted'
  camera: 'on' | 'off'
  speaker: 'available' | 'unavailable'
}

export type LiveClassroomSession = {
  id: string
  title: string
  subjectId: string
  subjectLabel: string
  topicId?: string
  topicLabel?: string
  level?: string
  language: ClassroomLanguage
  type: ClassroomSessionType
  source: ClassroomSource
  status: ClassroomStatus
  lobbyState: ClassroomLobbyState
  scheduledStartAt?: string
  scheduledEndAt?: string
  startedAt?: string
  endedAt?: string
  studentId: string
  studentName: string
  tutorId?: string
  tutorName?: string
  tutorTitle?: string
  context?: ClassroomContext
  materials: ClassroomMaterial[]
  participants: ClassroomParticipant[]
  messages: ClassroomMessage[]
  notes?: ClassroomNotes
  recommendedFocus?: string
}

export type StudentClassroomHomeData = {
  upcomingSession?: LiveClassroomSession
  instantHelpSession?: LiveClassroomSession
  recentSessions: LiveClassroomSession[]
  recommendedOptions: Array<{
    id: string
    title: string
    description: string
    sessionType: ClassroomSessionType
  }>
}

export type ScheduleClassroomInput = {
  subjectId: string
  subjectLabel: string
  topicId?: string
  topicLabel?: string
  level: string
  language: ClassroomLanguage
  type: ClassroomSessionType
  timeSlotId: string
  contextMessage?: string
  materials?: ClassroomMaterial[]
}

export type InstantVideoHelpInput = {
  source: Extract<ClassroomSource, 'learning_chat' | 'teacher_text_help' | 'question_bank' | 'practice_path' | 'uploaded_material'>
  conversationId?: string
  summary?: string
  studentMessage?: string
  topicLabel?: string
  materials?: ClassroomMaterial[]
}

export type TutorClassroomQueueData = {
  startingSoon: LiveClassroomSession[]
  instantRequests: LiveClassroomSession[]
  completedToday: LiveClassroomSession[]
}
