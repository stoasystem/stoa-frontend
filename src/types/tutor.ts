import type { ChatMessage } from '@/types/chat'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

export type TutorHelpRequestSummary = {
  requestId: string
  conversationId: string
  studentName: string
  subject: string
  grade: string
  status: TeacherHelpStatus
  createdAt: string
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
  messages: ChatMessage[]
}
