export type TutorAvailabilitySlot = {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string
  endTime: string
}

export type TutorAvailability = {
  weeklyAvailability: TutorAvailabilitySlot[]
  subjects: string[]
}
