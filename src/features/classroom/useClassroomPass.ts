import { useQuery, type QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/services/api/httpClient'
import { enterStudentClassroom, enterTeacherClassroom } from '@/services/classroom/classroomApi'
import { classroomQueryKeys } from '@/services/classroom/classroomQueryKeys'
import type { ClassroomPass } from '@/types/classroom'

/** Whose seat: the student's, by their conversation; the teacher's, by the request they hold. */
export type ClassroomSeat = { role: 'student'; conversationId: string } | { role: 'teacher'; requestId: string }

/**
 * - `loading`: the seat is being asked for.
 * - `ready`: here is the pass.
 * - `unavailable`: the classroom is not set up (503 `classroom_unavailable`),
 *   or briefly down (502/503/504); the conversation goes on as it was.
 * - `refused`: this request is not, or no longer, one this person may enter
 *   (403 / 404 / 409): ended, withdrawn, or someone else's.
 * - `failed`: anything else.
 */
export type ClassroomPassState =
  | { kind: 'loading' }
  | { kind: 'ready'; pass: ClassroomPass }
  | { kind: 'unavailable' | 'refused' | 'failed' }

function keyOf(seat: ClassroomSeat) {
  return seat.role === 'student' ? classroomQueryKeys.student(seat.conversationId) : classroomQueryKeys.teacher(seat.requestId)
}

/** How a student's seat is asked for: the service, or Ask's server in a test (#571). */
type EnterStudent = (conversationId: string) => Promise<ClassroomPass>

function enter(seat: ClassroomSeat, enterStudent: EnterStudent) {
  return seat.role === 'student' ? enterStudent(seat.conversationId) : enterTeacherClassroom(seat.requestId)
}

/** A refusal that asking again will not change. */
function settled(error: unknown) {
  return error instanceof ApiError && error.status !== undefined && error.status >= 400 && error.status < 600
}

function stateOf(error: unknown): 'unavailable' | 'refused' | 'failed' {
  if (!(error instanceof ApiError)) return 'failed'
  if (error.status === 502 || error.status === 503 || error.status === 504) return 'unavailable'
  if (error.status === 403 || error.status === 404 || error.status === 409) return 'refused'
  return 'failed'
}

/*
 * One seat per page visit: each ask makes the backend sign new tokens (and may
 * open the voice room), so it is kept, not read again on focus or remount,
 * until it is close to running out.
 */
const options = (seat: ClassroomSeat, enterStudent: EnterStudent = enterStudentClassroom) => ({
  queryKey: keyOf(seat),
  queryFn: () => enter(seat, enterStudent),
  staleTime: (query: { state: { data?: ClassroomPass } }) => {
    const expires = Date.parse(query.state.data?.expiresAt ?? '')
    return Number.isFinite(expires) ? Math.max(expires - Date.now() - 5 * 60_000, 0) : 0
  },
  gcTime: 10 * 60_000,
  retry: (failures: number, error: unknown) => !settled(error) && failures < 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})

/**
 * Whether the classroom can be entered now, asked before the student is taken
 * there after asking for a teacher: a classroom not set up leaves them in Ask,
 * as before (#696). The seat asked for is kept for the page.
 */
export async function classroomOpens(
  queryClient: QueryClient,
  seat: ClassroomSeat,
  enterStudent?: EnterStudent,
): Promise<boolean> {
  try {
    await queryClient.fetchQuery(options(seat, enterStudent))
    return true
  } catch {
    return false
  }
}

export function useClassroomPass(seat: ClassroomSeat | null): ClassroomPassState {
  const query = useQuery({
    ...options(seat ?? { role: 'student', conversationId: '' }),
    enabled: seat !== null,
  })
  if (query.data) return { kind: 'ready', pass: query.data }
  if (query.isError) return { kind: stateOf(query.error) }
  return { kind: 'loading' }
}
