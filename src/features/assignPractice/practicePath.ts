/*
 * Where a teacher recommends practice to a student (#703). The page reads its
 * student, and the help request it came from, from the address, so a help
 * request links to it in one line and the teacher never types an id:
 *
 *   <Link to={teacherPracticePathFor(request.student.id, request.requestId)}>
 */
export const TEACHER_PRACTICE_PATH = '/teacher/learning-automation'

/** An id as the backend writes them: a Cognito sub, a seeded `student-1`, a request id. */
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/

/** The value when it is an id, else "": an address can carry anything. */
export function readPracticeId(value: unknown): string {
  const id = typeof value === 'string' ? value.trim() : ''
  return ID.test(id) ? id : ''
}

/**
 * The practice page for this student, from this help request. A value that is
 * not an id is left out, so the page opens on its own student picker.
 */
export function teacherPracticePathFor(studentId: unknown, requestId?: unknown): string {
  const params = new URLSearchParams()
  const student = readPracticeId(studentId)
  const request = readPracticeId(requestId)
  if (student) params.set('studentId', student)
  if (request) params.set('request', request)
  const query = params.toString()
  return query ? `${TEACHER_PRACTICE_PATH}?${query}` : TEACHER_PRACTICE_PATH
}
