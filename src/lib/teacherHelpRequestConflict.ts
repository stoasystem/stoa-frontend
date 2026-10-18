/**
 * Whether a teacher's write on a help request was refused because the request
 * moved on: another teacher took it, the offer lapsed, or it ended. The server
 * says so with a 409 and asks for the request to be read again (#269).
 */
import { ApiError } from '@/services/api/httpClient'

const CONFLICT_CODES = new Set(['help_request_changed', 'help_request_not_held'])

export function isHelpRequestConflict(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    error.code !== undefined &&
    CONFLICT_CODES.has(error.code)
  )
}
