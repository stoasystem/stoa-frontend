import {
  cloneSession,
  getMockStudentClassroomHome,
  getMockTutorClassroomQueue,
  mockClassroomNotes,
  mockClassroomParticipants,
  mockLiveClassroomSessions,
} from '@/features/live-classroom/data/liveClassroomMockData'
import type {
  ClassroomNotes,
  InstantVideoHelpInput,
  LiveClassroomSession,
  ScheduleClassroomInput,
} from '@/features/live-classroom/types/liveClassroom'

let sessions: LiveClassroomSession[] = mockLiveClassroomSessions.map(cloneSession)

async function delay(ms = 250) {
  await new Promise((resolve) => window.setTimeout(resolve, ms))
}

function findSession(sessionId: string) {
  const session = sessions.find((item) => item.id === sessionId)
  if (!session) {
    throw new Error(`Classroom session not found: ${sessionId}`)
  }
  return session
}

export async function getStudentClassroomHome() {
  await delay()
  return getMockStudentClassroomHome(sessions)
}

export async function getClassroomSession(sessionId: string) {
  await delay()
  return cloneSession(findSession(sessionId))
}

export async function scheduleClassroomSession(input: ScheduleClassroomInput) {
  await delay(350)

  const scheduledStartAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
  const scheduledEndAt = new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString()
  const session: LiveClassroomSession = {
    id: `classroom-scheduled-${Date.now()}`,
    title: `${input.subjectLabel} Support`,
    subjectId: input.subjectId,
    subjectLabel: input.subjectLabel,
    topicId: input.topicId,
    topicLabel: input.topicLabel,
    level: input.level,
    language: input.language,
    type: input.type,
    source: 'scheduled',
    status: 'lobby_open',
    lobbyState: 'ready',
    scheduledStartAt,
    scheduledEndAt,
    studentId: 'student-demo',
    studentName: 'Anna Meier',
    tutorId: 'tutor-anna-keller',
    tutorName: 'Anna Keller',
    tutorTitle: 'Mathematics and Physics tutor',
    context: {
      sourceLabel: 'Scheduled classroom',
      topicLabel: input.topicLabel,
      summary: input.contextMessage || 'The student scheduled a live classroom session.',
      studentMessage: input.contextMessage,
      sourceUploadIds: input.materials?.map((material) => material.id),
    },
    materials: input.materials ?? [],
    participants: mockClassroomParticipants.map((participant) => ({ ...participant })),
    messages: [],
    notes: mockClassroomNotes,
    recommendedFocus: input.contextMessage || 'Review the student question step by step.',
  }

  sessions = [session, ...sessions]
  return cloneSession(session)
}

export async function requestInstantVideoHelp(input: InstantVideoHelpInput) {
  await delay(350)

  const session: LiveClassroomSession = {
    id: `classroom-instant-${Date.now()}`,
    title: 'Instant Video Help',
    subjectId: 'mathematics',
    subjectLabel: 'Mathematics',
    topicId: 'linear-equations',
    topicLabel: input.topicLabel ?? 'Current question',
    level: 'Lower Secondary',
    language: 'en',
    type: 'instant_video_help',
    source: input.source,
    status: 'lobby_open',
    lobbyState: 'tutor_ready',
    scheduledStartAt: new Date().toISOString(),
    scheduledEndAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    studentId: 'student-demo',
    studentName: 'Anna Meier',
    tutorId: 'tutor-anna-keller',
    tutorName: 'Anna Keller',
    tutorTitle: 'Mathematics and Physics tutor',
    context: {
      sourceConversationId: input.conversationId,
      sourceLabel: input.source === 'teacher_text_help'
        ? 'Teacher text help'
        : 'Learning Assistant conversation',
      topicLabel: input.topicLabel,
      summary: input.summary ?? 'The student needs deeper live support.',
      studentMessage: input.studentMessage,
      sourceUploadIds: input.materials?.map((material) => material.id),
    },
    materials: input.materials ?? [],
    participants: mockClassroomParticipants.map((participant) => ({ ...participant })),
    messages: [],
    notes: mockClassroomNotes,
    recommendedFocus: input.summary ?? 'Review the current question together.',
  }

  sessions = [session, ...sessions]
  return cloneSession(session)
}

export async function joinClassroomLobby(sessionId: string) {
  await delay(200)
  const session = findSession(sessionId)
  session.lobbyState = session.status === 'completed' ? 'completed' : 'ready'
  return cloneSession(session)
}

export async function joinClassroomRoom(sessionId: string) {
  await delay(300)
  const session = findSession(sessionId)
  if (session.status !== 'completed') {
    session.status = 'active'
    session.lobbyState = 'ready'
    session.startedAt = session.startedAt ?? new Date().toISOString()
  }
  return cloneSession(session)
}

export async function leaveClassroomRoom(sessionId: string) {
  await delay(150)
  const session = findSession(sessionId)
  if (session.status === 'active') {
    session.status = 'lobby_open'
  }
}

export async function completeClassroomSession(sessionId: string) {
  await delay(250)
  const session = findSession(sessionId)
  session.status = 'completed'
  session.lobbyState = 'completed'
  session.endedAt = new Date().toISOString()
  session.notes = session.notes ?? mockClassroomNotes
  return cloneSession(session)
}

export async function getTutorClassroomQueue() {
  await delay()
  return getMockTutorClassroomQueue(sessions)
}

export async function saveClassroomNotes(sessionId: string, notes: ClassroomNotes) {
  await delay(250)
  const session = findSession(sessionId)
  session.notes = {
    summary: notes.summary,
    keyPoints: [...notes.keyPoints],
    nextSteps: notes.nextSteps.map((nextStep) => ({ ...nextStep })),
  }
  return session.notes
}
