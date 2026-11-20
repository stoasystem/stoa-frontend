import type { ChatMessage } from '@/types/chat'
import type { AttachmentSummary } from '@/types/file'
import type { PracticeTeacherRequestContext } from '@/types/practice'
import type { HelpMode, TeacherHelpStatus } from '@/types/teacherHelp'

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

export type TeacherHelpRequestSummary = {
  requestId: string
  conversationId: string
  /**
   * The student the request is from (stoa-backend#495). Holding the request,
   * or having resolved it in the last 14 days, lets the teacher recommend
   * practice to this student (#703).
   */
  studentId?: string
  studentName: string
  subject: string
  grade: string
  status: TeacherHelpStatus
  /** How the student asked to be helped; missing means a text answer (`helpModeOf`, #705). */
  mode?: HelpMode
  requestMessage?: string
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
  firstTeacherActionAt?: string
  sla?: TeacherSlaSnapshot
}

export type TeacherHelpRequestNote = {
  id: string
  note: string
  createdAt: string
  // The API names the author `teacher` (backend `TeacherNoteOut`).
  teacher: {
    id: string
    name: string
  }
  // `null` for a plain-text reply.
  richContent?: TeacherReplyRichContent | null
  responseFormat?: string
  /** The pictures the reply carried (stoa-backend#145); none on an older one. */
  attachments?: AttachmentSummary[]
}

/**
 * A message of the help request's conversation as the teacher reads it. Its
 * attachments come as the server's summaries (`attachmentId`, `mediaType`),
 * not in the shape the student's own thread keeps them (#510).
 */
export type TeacherHelpMessage = Omit<ChatMessage, 'attachments'> & {
  attachments?: AttachmentSummary[]
}

export type TeacherHelpRequestDetail = {
  requestId: string
  conversationId: string
  student: {
    id: string
    name: string
    grade: string
  }
  subject: string
  status: TeacherHelpStatus
  /** How the student asked to be helped; missing means a text answer (`helpModeOf`, #705). */
  mode?: HelpMode
  requestMessage?: string
  practiceContext?: PracticeTeacherRequestContext
  messages: TeacherHelpMessage[]
  notes?: TeacherHelpRequestNote[]
  firstTeacherActionAt?: string
  sla?: TeacherSlaSnapshot
}

export type TeacherStats = {
  pendingRequests: number
  resolvedToday: number
  averageResponseTimeMinutes: number
}

export type TeacherProfile = {
  id: string
  userId: string
  name: string
  email: string
  accountStatus: string
  availabilityStatus: string
  subjects: string[]
  weeklyAvailability: TeacherAvailabilitySlot[]
  maxActiveSessions?: number | null
  createdAt: string
  updatedAt: string
}

export type TeacherAvailabilitySlot = {
  dayOfWeek: string | number
  startTime: string
  endTime: string
}
