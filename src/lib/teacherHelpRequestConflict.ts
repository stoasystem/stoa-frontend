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

/**
 * The server will not show this request to this teacher any more: someone
 * else took it (403) or it is gone (404). Asking again cannot change that;
 * any other failure (a timeout, a 500) may pass (#331).
 */
export function isHelpRequestOutOfReach(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

/** The app's one retry, but not for a read out of reach: the request, or a file in it. */
export function retryUnlessOutOfReach(failureCount: number, error: unknown): boolean {
  return !isHelpRequestOutOfReach(error) && failureCount < 1
}
