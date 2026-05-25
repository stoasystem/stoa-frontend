import type { ChatMessage } from '@/types/chat'
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
  messages: ChatMessage[]
  notes?: TutorHelpRequestNote[]
  firstTutorActionAt?: string
}

export type TutorStats = {
  pendingRequests: number
  resolvedToday: number
  averageResponseTimeMinutes: number
}
