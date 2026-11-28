import type { TeacherDispatchStatus } from '@/types/teacherAvailability'

/** The status as the copy names it (#768): `null` is a teacher who has never set it. */
export type TeacherDispatchStatusKey = TeacherDispatchStatus | 'unset'

export const dispatchStatusKey = (status: TeacherDispatchStatus | null): TeacherDispatchStatusKey => status ?? 'unset'
