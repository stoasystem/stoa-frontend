import type { TeacherAvailabilitySlot } from '@/types/teacherAvailability'

// `HH:MM`, as a time input gives it; older saves may carry seconds.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

/** Why a slot can't be saved, or null. Zero-padded times compare as strings. */
export function slotProblem(slot: TeacherAvailabilitySlot): 'invalidTime' | 'endBeforeStart' | null {
  if (!TIME_PATTERN.test(slot.startTime) || !TIME_PATTERN.test(slot.endTime)) return 'invalidTime'
  if (slot.endTime <= slot.startTime) return 'endBeforeStart'
  return null
}
