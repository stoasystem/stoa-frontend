import type { ProfileChoice, StudentProfile } from '@/types/student'

/** The backend's refusal of a code its list does not offer (stoa-backend#310): 422, `fields` names the field. */
export const PROFILE_CHOICE_UNKNOWN = 'profile_choice_unknown'

/**
 * The code a list-chosen profile field holds, or "" when it says nothing the
 * list offers (stoa-backend#310): never set, cleared, or old free text the
 * backend could not read back as a code.
 */
export function readableChoice(choices: readonly ProfileChoice[] | undefined, value: string | null | undefined): string {
  const code = value?.trim() ?? ''
  return code && choices?.some((choice) => choice.code === code) ? code : ''
}

/** The profile's year group as a code from its own list, or "" for none the student said. */
export function readableGrade(profile: Pick<StudentProfile, 'grade' | 'choices'>): string {
  return readableChoice(profile.choices?.grade, profile.grade)
}

/**
 * Whether the student has said their year group: a code from the list, or,
 * from a backend that sends no list yet, anything at all. What Ask's "add
 * your year group" hint asks (#154).
 */
export function saysGrade(profile: Pick<StudentProfile, 'grade' | 'choices'>): boolean {
  return profile.choices ? readableGrade(profile) !== '' : profile.grade.trim() !== ''
}

/** Whether to ask a student their year group: the backend offers a list, and the profile holds nothing from it. */
export function asksGrade(profile: Pick<StudentProfile, 'grade' | 'choices'>): boolean {
  return Boolean(profile.choices?.grade.length) && readableGrade(profile) === ''
}
