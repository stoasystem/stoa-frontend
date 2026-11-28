export type TeacherAvailabilitySlot = {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string
  endTime: string
}

/**
 * Whether the teacher takes dispatch (backend `CONTEXT.md`, 可接单状态;
 * stoa-backend#67). `null` means the teacher has never set it: their first
 * save of subjects or hours makes them available. The weekly hours are not
 * this status, and saving them leaves it as it is.
 */
export type TeacherDispatchStatus = 'available' | 'paused'

export type TeacherWeeklyAvailability = {
  weeklyAvailability: TeacherAvailabilitySlot[]
  subjects: string[]
  status: TeacherDispatchStatus | null
}

/** What the subjects-and-hours form saves: never the status, which the backend then keeps (#768). */
export type TeacherWeeklyAvailabilityUpdate = Pick<TeacherWeeklyAvailability, 'subjects' | 'weeklyAvailability'>
