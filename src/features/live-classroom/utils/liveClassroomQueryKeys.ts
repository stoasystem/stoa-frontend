export const liveClassroomQueryKeys = {
  all: ['live-classroom'] as const,
  studentHome: () => [...liveClassroomQueryKeys.all, 'student-home'] as const,
  session: (sessionId: string | undefined) =>
    [...liveClassroomQueryKeys.all, 'session', sessionId] as const,
  teacherQueue: () => [...liveClassroomQueryKeys.all, 'teacher-queue'] as const,
}
