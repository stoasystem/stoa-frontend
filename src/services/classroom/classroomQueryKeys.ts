export const classroomQueryKeys = {
  all: ['classroom'] as const,
  student: (conversationId: string) => [...classroomQueryKeys.all, 'student', conversationId] as const,
  teacher: (requestId: string) => [...classroomQueryKeys.all, 'teacher', requestId] as const,
}
