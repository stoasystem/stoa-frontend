/*
 * The virtual classroom in the design preview (#696), until stoa-backend#467
 * lands and after: its seats, a teacher to see it as, a stand-in whiteboard
 * and a stand-in voice. Dev server only.
 *
 *   ?role=teacher              signed in as the demo teacher, not the student
 *   ?classroom=unavailable     the seat is refused 503 `classroom_unavailable`
 *   ?classroom=boardFails      the whiteboard never loads (its timeout runs)
 *   ?mic=denied                the browser refuses the microphone
 *
 * A student who asks for a teacher here waits `TEACHER_JOINS_AFTER_MS`, then
 * the demo teacher has the request (`in_progress`), so the bar changes from
 * "finding a teacher" to "has joined" on its own.
 */
import { DEMO_HELP_CONVERSATION_ID, DEMO_TEACHER_NAME } from '@/dev/demo/data'
import { demo, demoConversation } from '@/dev/preview/demoSource'
import type { VoiceConnector } from '@/features/classroom/classroomVoice'
import type { ClassroomPass } from '@/types/classroom'
import type { TeacherHelpRequestDetail } from '@/types/teacher'
import type { User } from '@/types/user'

const setting = (name: string) => new URLSearchParams(window.location.search).get(name)

export const previewAsTeacher = () => setting('role') === 'teacher'
export const classroomUnavailable = () => setting('classroom') === 'unavailable'

/** How long the demo teacher takes to take a request asked for on this page. */
export const TEACHER_JOINS_AFTER_MS = 8_000

/** The demo teacher, signed in with `?role=teacher`. */
export const demoTeacher: User = {
  id: 'demo-teacher-1',
  name: DEMO_TEACHER_NAME,
  email: 'anna.brunner@example.com',
  role: 'teacher',
  preferredLanguage: 'en',
  preferredLocale: 'en',
  effectiveLocale: 'en',
  supportedLocales: ['de', 'en', 'fr', 'it'],
  emailVerificationStatus: 'verified',
  emailVerificationRequired: false,
  accountActivationStatus: 'active',
  mustChangePassword: false,
  verificationStatus: 'approved',
}

/** The request the demo teacher holds: the demo student's sine conversation. */
export const DEMO_CLASSROOM_REQUEST_ID = 'demo-help-1'

/** A seat, its board the stand-in page this dev server serves. */
export function demoClassroomPass(board: string): ClassroomPass {
  const params = new URLSearchParams({ board, token: 'design-preview' })
  return {
    whiteboardUrl:
      setting('classroom') === 'boardFails'
        ? 'https://whiteboard.design-preview.invalid/boards/never'
        : `${window.location.origin}/src/dev/whiteboard.html?${params}`,
    voice: { roomUrl: `https://stoa.daily.design-preview.invalid/stoa-${board}`, token: 'design-preview' },
    expiresAt: new Date(Date.now() + 3 * 3_600_000).toISOString(),
  }
}

/** `GET /teachers/me/help-requests/:id`: the demo student's sine conversation, held by the demo teacher. */
export function demoTeacherRequestDetail(requestId: string): TeacherHelpRequestDetail | null {
  if (requestId !== DEMO_CLASSROOM_REQUEST_ID) return null
  const conversation = demoConversation(DEMO_HELP_CONVERSATION_ID)
  const student = demo().demoStudent
  return {
    requestId,
    conversationId: DEMO_HELP_CONVERSATION_ID,
    student: { id: student.id, name: student.name, grade: 'Grade 9' },
    subject: 'math',
    status: 'in_progress',
    requestMessage: conversation?.messages.find((message) => message.role === 'student')?.content,
    messages: (conversation?.messages ?? []).map(({ attachments: _attachments, ...message }) => {
      void _attachments
      return message
    }),
    notes: [],
  }
}

/**
 * The stand-in voice: in the room at once, the other side there a moment
 * later and speaking now and then. Nothing leaves the page.
 */
export const previewVoiceConnector: VoiceConnector = async (_room, events) => {
  const timers: number[] = []
  if (setting('mic') === 'denied') timers.push(window.setTimeout(events.onMicDenied, 300))
  // The student is there before the teacher; the teacher comes once they take the request.
  const other = previewAsTeacher() ? demo().demoStudent.name : DEMO_TEACHER_NAME
  const joinsAfter = previewAsTeacher() ? 900 : TEACHER_JOINS_AFTER_MS
  timers.push(window.setTimeout(() => events.onRemote({ name: other }), joinsAfter))
  let speaking = false
  timers.push(
    window.setInterval(() => {
      speaking = !speaking
      events.onRemoteSpeaking(speaking)
    }, 2_200),
  )
  await new Promise((resolve) => window.setTimeout(resolve, 400))
  return {
    setMic: () => undefined,
    leave: async () => {
      for (const timer of timers) window.clearTimeout(timer)
    },
  }
}
