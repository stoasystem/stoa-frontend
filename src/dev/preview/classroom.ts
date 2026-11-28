/*
 * The virtual classroom in the design preview (#696), until stoa-backend#467
 * lands and after: its seats, a teacher to see it as, a stand-in whiteboard
 * and a stand-in voice. Dev server only.
 *
 *   ?role=teacher              signed in as the demo teacher, not the student
 *   ?classroom=unavailable     the seat is refused 503 `classroom_unavailable`
 *   ?classroom=boardFails      the whiteboard never loads (its timeout runs)
 *   ?mic=denied                the browser refuses the microphone
 *   ?teacherRequest=offered    the demo request is offered to the teacher, not
 *                              yet accepted: a reply is refused 409
 *                              `help_request_not_accepted` until it is (#705)
 *   ?teacherRequest=withdrawn  the student withdrew it before anyone took it
 *   ?teacherRequest=expired    nobody took it in time
 *   ?helpMode=classroom        the demo request asks for the classroom, not a
 *                              text answer (#705)
 *   ?helpPlan=teacherSupported the student's plan has text answers only: the
 *                              classroom is offered locked, with the upgrade (#705)
 *   ?helpPlan=classroomUsedUp  this week's classrooms are used up
 *   ?micPermission=granted|prompt|denied
 *                              where the browser stands on the microphone
 *                              before the student enters (`micPermission.ts`)
 *   ?teacherDispatch=paused|unset
 *                              the demo teacher's own status on
 *                              /teacher/availability (#768): paused, as the
 *                              backend leaves a teacher who missed a request,
 *                              or never set; left out, taking requests
 *
 * A student who asks for a teacher here waits `TEACHER_JOINS_AFTER_MS`, then
 * the demo teacher has the request (`in_progress`), so the bar changes from
 * "finding a teacher" to "has joined" on its own.
 */
import { DEMO_HELP_CONVERSATION_ID, DEMO_TEACHER_NAME } from '@/dev/demo/data'
import { demo, demoConversation } from '@/dev/preview/demoSource'
import type { VoiceConnector } from '@/features/classroom/classroomVoice'
import type { ClassroomPass } from '@/types/classroom'
import type { TeacherHelpRequestDetail, TeacherHelpRequestNote } from '@/types/teacher'
import type { TeacherWeeklyAvailability } from '@/types/teacherAvailability'
import type { TeacherAvailability, TeacherHelpStatus, TeacherSupportModeStanding } from '@/types/teacherHelp'
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

/*
 * Where the demo request stands for this page: held by the demo teacher, or
 * as `?teacherRequest=` says. Accepting it and replying move it, as on the
 * backend (stoa-backend#479); a reload starts again.
 */
let demoRequest: { status: TeacherHelpStatus; notes: TeacherHelpRequestNote[] } | null = null

function demoRequestState() {
  if (!demoRequest) {
    const asked = setting('teacherRequest')
    const status: TeacherHelpStatus =
      asked === 'offered' ? 'pending' : asked === 'withdrawn' || asked === 'expired' ? asked : 'in_progress'
    demoRequest = { status, notes: [] }
  }
  return demoRequest
}

/**
 * `PATCH /teachers/me/help-requests/:id`: accept it (`in_progress`) or finish
 * it (`resolved`). Null for another request; `'ended'` once it ended.
 */
export function demoTeacherChangeStatus(requestId: string, status: unknown): { status: TeacherHelpStatus } | 'ended' | null {
  if (requestId !== DEMO_CLASSROOM_REQUEST_ID) return null
  const state = demoRequestState()
  if (state.status === 'withdrawn' || state.status === 'expired') return 'ended'
  if (status === 'in_progress' || status === 'resolved') state.status = status
  return { status: state.status }
}

/**
 * `POST /teachers/me/help-requests/:id/notes`: only from the teacher holding
 * it. Offered and not accepted, `'not_accepted'`; ended, `'ended'`.
 */
export function demoTeacherReply(
  requestId: string,
  note: { content: string; richContent?: TeacherHelpRequestNote['richContent'] },
): TeacherHelpRequestNote | 'not_accepted' | 'ended' | null {
  if (requestId !== DEMO_CLASSROOM_REQUEST_ID) return null
  const state = demoRequestState()
  if (state.status === 'pending') return 'not_accepted'
  if (state.status !== 'in_progress' && state.status !== 'resolved') return 'ended'
  const written: TeacherHelpRequestNote = {
    id: `demo-note-${state.notes.length + 1}`,
    note: note.content,
    createdAt: new Date().toISOString(),
    teacher: { id: demoTeacher.id, name: demoTeacher.name },
    richContent: note.richContent ?? null,
  }
  state.notes.push(written)
  return written
}

/** `GET /teachers/me/help-requests/:id`: the demo student's sine conversation, held by the demo teacher. */
export function demoTeacherRequestDetail(requestId: string): TeacherHelpRequestDetail | null {
  if (requestId !== DEMO_CLASSROOM_REQUEST_ID) return null
  const state = demoRequestState()
  const conversation = demoConversation(DEMO_HELP_CONVERSATION_ID)
  const student = demo().demoStudent
  return {
    requestId,
    conversationId: DEMO_HELP_CONVERSATION_ID,
    student: { id: student.id, name: student.name, grade: 'Grade 9' },
    // `helpSubject=none`: a request with no subject, which reader endpoints send as null (stoa-backend#637, #745).
    subject: setting('helpSubject') === 'none' ? null : 'math',
    status: state.status,
    mode: setting('helpMode') === 'classroom' ? 'classroom' : 'text',
    requestMessage: conversation?.messages.find((message) => message.role === 'student')?.content,
    messages: (conversation?.messages ?? []).map(({ attachments: _attachments, ...message }) => {
      void _attachments
      return message
    }),
    notes: [...state.notes],
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

/**
 * `GET /teacher-help/availability` as `?helpPlan=` sets the student's plan:
 * the online classroom plan by default (the demo data), text answers only, or
 * this week's classrooms used up (stoa-backend#482).
 */
export function demoAvailabilityForPlan(availability: TeacherAvailability): TeacherAvailability {
  const plan = setting('helpPlan')
  const support = availability.teacherSupport
  if (!support || (plan !== 'teacherSupported' && plan !== 'classroomUsedUp')) return availability
  const classroom: TeacherSupportModeStanding =
    plan === 'teacherSupported'
      ? { canRequest: false, remainingCases: 0, weeklyCases: 0, blockedReason: 'teacher_support_not_included', resetsAt: null }
      : { canRequest: false, remainingCases: 0, weeklyCases: 2, blockedReason: 'teacher_support_allowance_exhausted', resetsAt: null }
  return { ...availability, teacherSupport: { ...support, classroom } }
}

/*
 * The demo teacher's own subjects, hours and status (`/teachers/me/availability`,
 * #768), kept for the tab as the backend keeps them: a field left out of a
 * save is kept, and a first save of subjects or hours by a teacher who never
 * set the status makes them available.
 */
let ownAvailability: TeacherWeeklyAvailability | null = null

export function demoOwnAvailability(): TeacherWeeklyAvailability {
  if (!ownAvailability) {
    const asked = setting('teacherDispatch')
    ownAvailability = {
      subjects: ['math', 'physics'],
      weeklyAvailability: [{ dayOfWeek: 'saturday', startTime: '10:00', endTime: '12:00' }],
      status: asked === 'paused' ? 'paused' : asked === 'unset' ? null : 'available',
    }
  }
  return ownAvailability
}

export function saveDemoOwnAvailability(body: unknown): TeacherWeeklyAvailability {
  const now = demoOwnAvailability()
  const sent = (typeof body === 'object' && body !== null ? body : {}) as Partial<TeacherWeeklyAvailability>
  const status = sent.status === 'available' || sent.status === 'paused' ? sent.status : null
  const savedHours = sent.subjects !== undefined || sent.weeklyAvailability !== undefined
  ownAvailability = {
    subjects: sent.subjects ?? now.subjects,
    weeklyAvailability: sent.weeklyAvailability ?? now.weeklyAvailability,
    status: status ?? (savedHours && now.status === null ? 'available' : now.status),
  }
  return ownAvailability
}
