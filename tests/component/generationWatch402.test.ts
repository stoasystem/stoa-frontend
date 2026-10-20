/**
 * The wait for an answer ends six minutes after it began, on the wall clock
 * (#402). A device that sleeps, or a tab held in the background, stops the
 * timers but not the clock: it wakes past the limit at once, and the watcher
 * gave up without reading the command - the answer the server had finished
 * meanwhile never showed, and the student was offered "failed / resend".
 *
 * Here the clock is moved on without the timers, as sleep does, and the next
 * wait then ends as it would on waking.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/chat/chatStreamApi', () => ({
  getGenerationProgress: vi.fn(),
}))

import { ApiError } from '@/services/api/httpClient'
import { getGenerationProgress, type GenerationState } from '@/services/chat/chatStreamApi'
import { watchGeneration, type GenerationOutcome } from '@/services/chat/generationWatch'

const mockedProgress = vi.mocked(getGenerationProgress)

function state(overrides: Partial<GenerationState> = {}): GenerationState {
  return {
    conversationId: 'c1',
    steps: [],
    updatedAt: new Date(Date.now() + 60_000).toISOString(),
    commandId: 'command-1',
    attempt: 1,
    status: 'ai_running',
    assistantMessageId: null,
    failureCategory: null,
    retryable: null,
    ...overrides,
  }
}

function watch({ requestDone = true } = {}) {
  let outcome: GenerationOutcome | null = null
  const watcher = watchGeneration({
    conversationId: 'c1',
    idempotencyKey: 'key-1',
    askedAt: new Date().toISOString(),
    signal: new AbortController().signal,
    onSteps: () => {},
    requestDone,
  })
  void watcher.outcome.then((settled) => {
    outcome = settled
  })
  return { outcome: () => outcome }
}

/** Asleep for longer than the wait is given: the clock runs on, the timers do not. */
async function sleepPastTheLimit() {
  // The first read, before the device sleeps.
  await vi.advanceTimersByTimeAsync(1000)
  vi.setSystemTime(Date.now() + 361_000)
}

describe('a wait that wakes past its limit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('still reads the command, and takes the answer it finds', async () => {
    mockedProgress.mockResolvedValueOnce(state()).mockResolvedValue(state({ status: 'completed', assistantMessageId: 'a-1' }))
    const { outcome } = watch()

    await sleepPastTheLimit()
    expect(mockedProgress).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mockedProgress).toHaveBeenCalledTimes(2)
    expect(outcome()).toEqual({ kind: 'completed' })
  })

  it('ends as timed out when that read finds the command still running', async () => {
    mockedProgress.mockResolvedValue(state())
    const { outcome } = watch()

    await sleepPastTheLimit()
    await vi.advanceTimersByTimeAsync(1000)

    expect(outcome()).toEqual({ kind: 'timed_out' })
    expect(mockedProgress).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mockedProgress).toHaveBeenCalledTimes(2)
  })

  it('does not take a read that fails as the device wakes for the verdict', async () => {
    // The network is often not back the moment the timers run again.
    mockedProgress
      .mockResolvedValueOnce(state())
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(state({ status: 'completed', assistantMessageId: 'a-1' }))
    const { outcome } = watch()

    await sleepPastTheLimit()
    await vi.advanceTimersByTimeAsync(1000)
    expect(outcome()).toBeNull()
    await vi.advanceTimersByTimeAsync(1000)

    expect(outcome()).toEqual({ kind: 'completed' })
  })

  it('still ends when every read fails, with the send still on its way', async () => {
    // While the send is going, failed reads alone do not end the wait; before
    // #402 the clock did, and past the limit it still must.
    mockedProgress.mockResolvedValueOnce(state()).mockRejectedValue(new Error('Network Error'))
    const { outcome } = watch({ requestDone: false })

    await sleepPastTheLimit()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(outcome()).toEqual({ kind: 'timed_out' })
    expect(mockedProgress).toHaveBeenCalledTimes(6)
  })

  it('ends as timed out when the message is still not stored, with the send still on its way', async () => {
    mockedProgress.mockRejectedValue(
      new ApiError('This message request is unavailable. Send it again.', { status: 409, code: 'message_command_not_found' }),
    )
    const { outcome } = watch({ requestDone: false })

    await sleepPastTheLimit()
    await vi.advanceTimersByTimeAsync(1000)

    expect(outcome()).toEqual({ kind: 'timed_out' })
    expect(mockedProgress).toHaveBeenCalledTimes(2)
  })
})
