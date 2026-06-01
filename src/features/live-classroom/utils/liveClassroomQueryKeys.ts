export const liveClassroomQueryKeys = {
  all: ['live-classroom'] as const,
  studentHome: () => [...liveClassroomQueryKeys.all, 'student-home'] as const,
  session: (sessionId: string | undefined) =>
    [...liveClassroomQueryKeys.all, 'session', sessionId] as const,
  tutorQueue: () => [...liveClassroomQueryKeys.all, 'tutor-queue'] as const,
}
