import type { ChatMessage } from '@/types/chat'
import type { PracticeTeacherRequestContext } from '@/types/practice'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

export type TeacherReplyBlock =
  | { type: 'paragraph' | 'heading' | 'ordered_list' | 'unordered_list' | 'quote' | 'code'; text: string }
  | { type: 'formula'; latex: string }

export type TeacherReplyRichContent = {
  version: 1
  blocks: TeacherReplyBlock[]
}

export type TeacherSlaSnapshot = {
  status: 'within_target' | 'at_risk' | 'breached' | 'unknown'
  requestToFirstActionMinutes?: number | null
  targetMinutes: number
}

export type TutorHelpRequestSummary = {
  requestId: string
  conversationId: string
  studentName: string
  subject: string
  grade: string
  status: TeacherHelpStatus
  requestMessage?: string
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
  firstTutorActionAt?: string
  sla?: TeacherSlaSnapshot
}

export type TutorHelpRequestNote = {
  id: string
  note: string
  createdAt: string
  tutor: {
    id: string
    name: string
  }
  richContent?: TeacherReplyRichContent
  responseFormat?: string
}

export type TutorHelpRequestDetail = {
  requestId: string
  conversationId: string
  student: {
    id: string
    name: string
    grade: string
  }
  subject: string
  status: TeacherHelpStatus
  requestMessage?: string
  practiceContext?: PracticeTeacherRequestContext
  messages: ChatMessage[]
  notes?: TutorHelpRequestNote[]
  firstTutorActionAt?: string
  sla?: TeacherSlaSnapshot
}

export type TutorStats = {
  pendingRequests: number
  resolvedToday: number
  averageResponseTimeMinutes: number
}

export type TeacherAssistanceSummary = {
  summaryId: string
  questionId: string
  studentId: string
  subject: string
  studentContextSummary: string
  questionSummary: string
  aiAnswerSummary: string
  weakTopics: string[]
  suggestedFocus: string
  sourceCount: number
  createdAt: string
}

export type AiTeacherDraftType = 'teacher_summary' | 'practice_exercise'

export type AiTeacherDraftStatus = 'draft' | 'accepted' | 'rejected' | 'archived'

export type AiTeacherExerciseItem = {
  id: string
  type: string
  prompt: string
  choices?: string[]
}

export type AiTeacherAnswerKeyItem = {
  itemId: string
  answer: string
}

export type AiTeacherExplanationItem = {
  itemId: string
  explanation: string
}

export type AiTeacherDraft = {
  draftId: string
  draftType: AiTeacherDraftType
  status: AiTeacherDraftStatus
  studentId?: string | null
  questionId?: string | null
  subject?: string | null
  topicIds: string[]
  sessionSummary?: string | null
  misconceptionSummary?: string | null
  suggestedTeachingFocus?: string | null
  draftFollowupExplanation?: string | null
  sourceContext: Record<string, unknown>
  promptVersion?: string | null
  createdBy?: string | null
  createdByRole?: string | null
  createdAt?: string | null
  generatedAt?: string | null
  updatedAt?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNote?: string | null
  previousDraftId?: string | null
  studentDeliveryStatus: 'not_delivered' | 'delivered'
  difficulty?: string | null
  exerciseCount: number
  items: AiTeacherExerciseItem[]
  answerKey: AiTeacherAnswerKeyItem[]
  explanations: AiTeacherExplanationItem[]
}

export type AiTeacherDraftList = {
  items: AiTeacherDraft[]
  count: number
}

export type CreateExerciseDraftPayload = {
  studentId: string
  subject: string
  topicIds: string[]
  difficulty: string
  exerciseCount: number
  questionId?: string
}

export type ReviewAiTeacherDraftPayload = {
  draftId: string
  note?: string
}

export type TutorProfile = {
  id: string
  userId: string
  name: string
  email: string
  accountStatus: string
  availabilityStatus: string
  subjects: string[]
  weeklyAvailability: TutorAvailabilitySlot[]
  maxActiveSessions?: number | null
  createdAt: string
  updatedAt: string
}

export type TutorAvailabilitySlot = {
  dayOfWeek: string | number
  startTime: string
  endTime: string
}
