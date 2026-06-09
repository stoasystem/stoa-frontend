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

export type TutorQualification = {
  title: string
  institution?: string
  verified: boolean
}

export type TutorPayoutProfile = {
  method: 'bank_transfer' | 'paypal' | 'not_configured'
  accountHolder: string
  bankName?: string
  maskedIban?: string
  payoutEmail?: string
  currency: string
  settlementCycle: string
  nextPayoutDate?: string
  lastPayoutDate?: string
  contractType: string
  taxStatus: string
}

export type TutorComplianceProfile = {
  credentialReview: 'verified' | 'pending' | 'needs_update'
  backgroundCheck: 'verified' | 'pending' | 'not_required'
  termsAcceptedAt?: string
}

export type TutorProfile = {
  id: string
  userId: string
  name: string
  email: string
  phone?: string
  city?: string
  country?: string
  timezone: string
  accountStatus: 'active' | 'pending_review' | 'paused'
  verificationStatus: 'verified' | 'pending' | 'needs_update'
  teachingSummary: string
  subjects: string[]
  levels: string[]
  languages: string[]
  qualifications: TutorQualification[]
  availabilitySummary: string
  payout: TutorPayoutProfile
  compliance: TutorComplianceProfile
  createdAt: string
  updatedAt: string
}
