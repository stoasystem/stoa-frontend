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
  /*
   * The preparation table (#704), picked by the backend (stoa-backend#517);
   * the page never picks them out of `messages` itself.
   */
  /** The student's first question of the conversation; `null` when they asked none. */
  firstQuestion?: TeacherPrepQuestion | null
  /**
   * Their last question before asking for help (anything sent after it does
   * not count); `null` when it is the first one, which is then the only row.
   */
  lastQuestion?: TeacherPrepQuestion | null
  /** Everything the student sent in the conversation, in order, each once. */
  uploads?: AttachmentSummary[]
  /** Stars on the star map the conversation's Ask answers named, newest first, titled in the teacher's language. */
  askedStars?: TeacherAskedStar[]
  /** Read from the student's answers by the full view only; the poll's `view=live` leaves both empty. */
  commonErrorCause?: TeacherErrorCause | null
  aiHelpedStars?: TeacherAiHelpedStar[]
}

export type TeacherErrorCause = {
  category: string
  misconception: string
  count: number
  recentMistakes: number
}

export type TeacherAiHelpedStar = {
  unitId: string
  title: string
  independent: number
  askedAi: number
}

/** One of the student's questions as the preparation table shows it (stoa-backend#517). */
export type TeacherPrepQuestion = {
  /** The message's id in `messages`: the table leads to it in the conversation. */
  messageId: string
  content: string
  createdAt: string
  attachments?: AttachmentSummary[]
}

export type TeacherAskedStar = {
  unitId: string
  title: string
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
