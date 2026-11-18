/**
 * Whether a student is offered the online classroom as a way for a teacher to
 * help (#705). Off by default: the backend does not yet check the classroom
 * against the student's plan (stoa-backend#482) nor admit only classroom
 * requests a teacher has accepted (stoa-backend#481), so a student must not be
 * able to pick a classroom they cannot use. Until then every request is a
 * text answer.
 *
 * On with `VITE_CLASSROOM_HELP=on` at build time; on the dev server also with
 * `?classroomHelp=on` in the address (the design preview, for screenshots).
 *
 * What a teacher sees follows the request's own `mode`, not this switch.
 */
export function classroomHelpOffered(): boolean {
  if (import.meta.env.VITE_CLASSROOM_HELP === 'on') return true
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('classroomHelp') === 'on'
}
