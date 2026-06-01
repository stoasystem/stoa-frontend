import type {
  ClassroomMaterial,
  ClassroomMessage,
  ClassroomNotes,
  ClassroomParticipant,
  LiveClassroomSession,
  StudentClassroomHomeData,
  TutorClassroomQueueData,
} from '@/features/live-classroom/types/liveClassroom'

const now = new Date('2026-06-02T14:00:00.000Z')

function iso(hoursFromNow: number) {
  return new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000).toISOString()
}

export const mockClassroomMaterials: ClassroomMaterial[] = [
  {
    id: 'material-question-photo',
    title: 'linear-equation-photo.jpg',
    type: 'image',
    previewUrl: '/assets/study-materials-Dt0Vs4Ee.jpeg',
    url: '/assets/study-materials-Dt0Vs4Ee.jpeg',
    fileSize: 860_000,
    mimeType: 'image/jpeg',
    uploadedByRole: 'student',
    createdAt: iso(-2),
  },
  {
    id: 'material-worksheet',
    title: 'equations-worksheet.pdf',
    type: 'pdf',
    fileSize: 1_240_000,
    mimeType: 'application/pdf',
    uploadedByRole: 'student',
    createdAt: iso(-1.8),
  },
]

export const mockClassroomParticipants: ClassroomParticipant[] = [
  {
    id: 'student-demo',
    role: 'student',
    displayName: 'Anna Meier',
    levelLabel: 'Lower Secondary',
    languageLabels: ['English', 'German'],
    cameraStatus: 'off',
    microphoneStatus: 'muted',
    connectionStatus: 'connected',
  },
  {
    id: 'tutor-anna-keller',
    role: 'tutor',
    displayName: 'Anna Keller',
    subjectLabels: ['Mathematics', 'Physics'],
    languageLabels: ['English', 'German'],
    cameraStatus: 'on',
    microphoneStatus: 'unmuted',
    connectionStatus: 'connected',
  },
]

function createMessages(sessionId: string): ClassroomMessage[] {
  return [
    {
      id: `${sessionId}-message-1`,
      sessionId,
      senderId: 'tutor-anna-keller',
      senderRole: 'tutor',
      senderName: 'Anna Keller',
      body: "Let's look at the first step together.",
      createdAt: iso(-0.5),
    },
    {
      id: `${sessionId}-message-2`,
      sessionId,
      senderId: 'student-demo',
      senderRole: 'student',
      senderName: 'Anna Meier',
      body: "I don't understand why we subtract 3 first.",
      createdAt: iso(-0.45),
    },
    {
      id: `${sessionId}-message-3`,
      sessionId,
      senderId: 'tutor-anna-keller',
      senderRole: 'tutor',
      senderName: 'Anna Keller',
      body: 'We isolate 2x by keeping both sides balanced.',
      createdAt: iso(-0.4),
    },
  ]
}

export const mockClassroomNotes: ClassroomNotes = {
  summary: 'We reviewed how to isolate the variable in a two-step equation.',
  keyPoints: [
    'Subtract the same value from both sides.',
    'Divide both sides by the coefficient.',
    'Check the solution by substituting it back.',
  ],
  nextSteps: [
    {
      id: 'next-practice-equations',
      label: 'Retry Linear Equations Basics',
      targetType: 'practice_lesson',
      targetUrl: '/practice/mathematics/equations/lessons/linear-equations-basics',
    },
    {
      id: 'next-question-bank',
      label: 'Practice similar questions',
      targetType: 'question_set',
      targetUrl: '/question-bank/sets/qb-linear-equations-basics',
    },
    {
      id: 'next-chat',
      label: 'Ask a follow-up in Learning Chat',
      targetType: 'chat',
      targetUrl: '/chat',
    },
  ],
}

export const mockLiveClassroomSessions: LiveClassroomSession[] = [
  {
    id: 'classroom-linear-equations',
    title: 'Mathematics Support',
    subjectId: 'mathematics',
    subjectLabel: 'Mathematics',
    topicId: 'linear-equations',
    topicLabel: 'Linear Equations',
    level: 'Lower Secondary',
    language: 'en',
    type: 'standard_session',
    source: 'scheduled',
    status: 'lobby_open',
    lobbyState: 'tutor_ready',
    scheduledStartAt: iso(3.5),
    scheduledEndAt: iso(4),
    studentId: 'student-demo',
    studentName: 'Anna Meier',
    tutorId: 'tutor-anna-keller',
    tutorName: 'Anna Keller',
    tutorTitle: 'Mathematics and Physics tutor',
    context: {
      sourceLabel: 'Scheduled classroom',
      topicLabel: 'Linear Equations',
      summary: 'The student wants help with two-step equations and balancing both sides.',
    },
    materials: mockClassroomMaterials,
    participants: mockClassroomParticipants,
    messages: createMessages('classroom-linear-equations'),
    notes: mockClassroomNotes,
    recommendedFocus: 'Explain equation balance visually before solving.',
  },
  {
    id: 'classroom-instant-video-help',
    title: 'Instant Video Help',
    subjectId: 'mathematics',
    subjectLabel: 'Mathematics',
    topicId: 'linear-equations',
    topicLabel: 'Linear Equations',
    level: 'Lower Secondary',
    language: 'en',
    type: 'instant_video_help',
    source: 'teacher_text_help',
    status: 'waiting_for_tutor',
    lobbyState: 'waiting_for_tutor',
    scheduledStartAt: iso(0),
    scheduledEndAt: iso(0.25),
    studentId: 'student-demo',
    studentName: 'Anna Meier',
    tutorId: 'tutor-anna-keller',
    tutorName: 'Anna Keller',
    tutorTitle: 'Mathematics and Physics tutor',
    context: {
      sourceConversationId: 'conversation-demo',
      sourceLabel: 'Learning Assistant conversation',
      topicLabel: 'Linear Equations',
      summary: 'The student understands subtracting 3 but is confused about dividing both sides by 2.',
      studentMessage: 'I still do not understand why we divide both sides by 2.',
      sourceUploadIds: ['material-question-photo'],
    },
    materials: [mockClassroomMaterials[0]],
    participants: mockClassroomParticipants,
    messages: createMessages('classroom-instant-video-help'),
    notes: mockClassroomNotes,
    recommendedFocus: 'Use a visual balance explanation for the divide step.',
  },
  {
    id: 'classroom-completed-equations',
    title: 'Linear Equations Review',
    subjectId: 'mathematics',
    subjectLabel: 'Mathematics',
    topicId: 'linear-equations',
    topicLabel: 'Linear Equations',
    level: 'Lower Secondary',
    language: 'en',
    type: 'quick_help',
    source: 'practice_path',
    status: 'completed',
    lobbyState: 'completed',
    scheduledStartAt: iso(-26),
    scheduledEndAt: iso(-25.5),
    startedAt: iso(-26),
    endedAt: iso(-25.5),
    studentId: 'student-demo',
    studentName: 'Anna Meier',
    tutorId: 'tutor-anna-keller',
    tutorName: 'Anna Keller',
    tutorTitle: 'Mathematics and Physics tutor',
    context: {
      sourcePracticeLessonId: 'linear-equations-basics',
      sourceLabel: 'Practice Path lesson',
      topicLabel: 'Linear Equations',
      summary: 'The student reviewed equation balance and then completed similar practice.',
    },
    materials: mockClassroomMaterials,
    participants: mockClassroomParticipants,
    messages: createMessages('classroom-completed-equations'),
    notes: mockClassroomNotes,
    recommendedFocus: 'Keep practising multi-step transformations.',
  },
]

export function cloneSession(session: LiveClassroomSession): LiveClassroomSession {
  return {
    ...session,
    context: session.context ? { ...session.context } : undefined,
    materials: session.materials.map((material) => ({ ...material })),
    participants: session.participants.map((participant) => ({ ...participant })),
    messages: session.messages.map((message) => ({ ...message })),
    notes: session.notes
      ? {
          ...session.notes,
          keyPoints: [...session.notes.keyPoints],
          nextSteps: session.notes.nextSteps.map((nextStep) => ({ ...nextStep })),
        }
      : undefined,
  }
}

export function getMockStudentClassroomHome(sessions: LiveClassroomSession[]): StudentClassroomHomeData {
  const upcomingSession = sessions.find((session) =>
    ['scheduled', 'lobby_open', 'waiting_for_tutor', 'active'].includes(session.status),
  )

  return {
    upcomingSession: upcomingSession ? cloneSession(upcomingSession) : undefined,
    instantHelpSession: cloneSession(mockLiveClassroomSessions[1]),
    recentSessions: sessions
      .filter((session) => session.status === 'completed')
      .map(cloneSession),
    recommendedOptions: [
      {
        id: 'quick-help',
        title: 'Quick Help',
        description: '15 minutes for one focused question.',
        sessionType: 'quick_help',
      },
      {
        id: 'standard-session',
        title: 'Standard Session',
        description: '30 minutes for a homework topic or practice review.',
        sessionType: 'standard_session',
      },
      {
        id: 'deep-review',
        title: 'Deep Review',
        description: '60 minutes for exam preparation or repeated weak spots.',
        sessionType: 'deep_review',
      },
    ],
  }
}

export function getMockTutorClassroomQueue(sessions: LiveClassroomSession[]): TutorClassroomQueueData {
  return {
    startingSoon: sessions
      .filter((session) => ['scheduled', 'lobby_open'].includes(session.status))
      .map(cloneSession),
    instantRequests: sessions
      .filter((session) => session.type === 'instant_video_help' && session.status !== 'completed')
      .map(cloneSession),
    completedToday: sessions
      .filter((session) => session.status === 'completed')
      .map(cloneSession),
  }
}
