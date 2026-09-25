import { ApiError } from '@/services/api/httpClient'
import { getGenerationProgress } from '@/services/chat/chatStreamApi'

/**
 * How a message ended, as its command on the server tells it.
 *
 * `missing` means the server never stored the message, so sending it again
 * with the same key is a first send. `timed_out` means no answer came within
 * the limit; the same key is still safe to send again, and replays the answer
 * if one arrived meanwhile.
 */
export type GenerationOutcome =
  | { kind: 'completed' }
  | { kind: 'failed'; retryable: boolean }
  | { kind: 'missing' }
  | { kind: 'timed_out' }
  | { kind: 'aborted' }

// Quick at first, when most answers land, then every few seconds.
const POLL_DELAYS_MS = [1000, 1000, 1000, 2000, 2000, 3000]
const POLL_STEADY_MS = 5000
// Past the generation worker's three-minute limit, so an answer that is still
// being written is not given up on.
const GENERATION_WAIT_LIMIT_MS = 240_000
const MAX_CONSECUTIVE_READ_FAILURES = 5

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

/**
 * Read one message's command until it ends, passing its steps on as they land.
 *
 * Runs alongside the send request. Until the request is done (`requestDone`,
 * or `markRequestDone` later) a message that is not found is simply not stored
 * yet; after that, not found means never stored. `askedAt` screens out a previous answer's steps when the
 * server does not bind them to the command.
 */
export function watchGeneration({
  conversationId,
  idempotencyKey,
  askedAt,
  signal,
  onSteps,
  requestDone = false,
}: {
  conversationId: string
  idempotencyKey: string
  askedAt: string
  signal: AbortSignal
  onSteps: (steps: string[]) => void
  requestDone?: boolean
}) {
  let settled = requestDone
  const startedAt = Date.now()

  const outcome = (async (): Promise<GenerationOutcome> => {
    let reads = 0
    let failures = 0
    while (true) {
      await wait(POLL_DELAYS_MS[reads] ?? POLL_STEADY_MS, signal)
      reads += 1
      if (signal.aborted) return { kind: 'aborted' }
      if (Date.now() - startedAt > GENERATION_WAIT_LIMIT_MS) return { kind: 'timed_out' }
      try {
        const state = await getGenerationProgress(conversationId, signal, idempotencyKey)
        failures = 0
        if (state.steps.length > 0 && (state.status != null || state.updatedAt >= askedAt)) {
          onSteps(state.steps)
        }
        if (state.status === 'completed') return { kind: 'completed' }
        if (state.status === 'failed') {
          return { kind: 'failed', retryable: state.retryable === true }
        }
      } catch (error) {
        if (signal.aborted) return { kind: 'aborted' }
        if (error instanceof ApiError && error.code === 'message_command_not_found') {
          if (settled) return { kind: 'missing' }
          continue
        }
        failures += 1
        if (settled && failures >= MAX_CONSECUTIVE_READ_FAILURES) return { kind: 'timed_out' }
      }
    }
  })()

  return {
    outcome,
    markRequestDone: () => {
      settled = true
    },
  }
}
