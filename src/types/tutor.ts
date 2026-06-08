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
