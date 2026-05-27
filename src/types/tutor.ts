import type { ChatMessage } from '@/types/chat'
import type { PracticeTeacherRequestContext } from '@/types/practice'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

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
}

export type TutorHelpRequestNote = {
  id: string
  note: string
  createdAt: string
  tutor: {
    id: string
    name: string
  }
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
}

export type TutorStats = {
  pendingRequests: number
  resolvedToday: number
  averageResponseTimeMinutes: number
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
