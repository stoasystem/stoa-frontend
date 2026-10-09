export type TeacherAvailabilitySlot = {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string
  endTime: string
}

export type TeacherWeeklyAvailability = {
  weeklyAvailability: TeacherAvailabilitySlot[]
  subjects: string[]
}
