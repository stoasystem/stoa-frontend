/**
 * A voice question (#697): the child presses the microphone, speaks, presses
 * it again, and STOA's backend turns the recording into text
 * (`POST /students/me/voice-questions/transcriptions`, stoa-backend#469).
 *
 * The speech model (Voxtral on Bedrock) takes only mp3 and wav
 * (stoa-backend#542), and MediaRecorder makes neither: Chrome records WebM,
 * Safari MP4. So the page records PCM itself with Web Audio and writes a
 * 16 kHz mono 16-bit WAV (#726, `wav.ts`), at most 2 MiB and 60 seconds. A
 * browser without an audio worklet gets the device's own dictation instead
 * (#515), as before.
 */

/** The longest recording the backend takes; the recording stops itself here. */
export const MAX_RECORDING_SECONDS = 60
/** The largest recording the backend takes (`MAX_BYTES`); a full minute of WAV is 1.92 MB. */
export const MAX_RECORDING_BYTES = 2 * 1024 * 1024
/** What a recording is declared as (`Content-Type`). */
export const RECORDING_TYPE = 'audio/wav'

interface RecordingWindow {
  AudioContext?: unknown
  AudioWorkletNode?: unknown
  navigator?: { mediaDevices?: { getUserMedia?: unknown } }
}

/**
 * Whether this browser can record a voice question: Web Audio with an audio
 * worklet (Chrome 66, Safari 14.1, Firefox 76, all on a secure page) and a
 * microphone to ask for.
 */
export function canRecordVoiceHere(
  win: RecordingWindow | undefined = typeof window === 'undefined' ? undefined : (window as unknown as RecordingWindow),
): boolean {
  if (typeof win?.AudioContext !== 'function') return false
  if (typeof win.AudioWorkletNode !== 'function') return false
  return typeof win.navigator?.mediaDevices?.getUserMedia === 'function'
}

/**
 * How many times one recording is sent before "try again" stops being
 * offered: the backend allows one retry of the same recording after a 503
 * (`max_attempts: 1` in `client-error-actions.json`, stoa-backend#542), and
 * the child should not be left pressing a button that cannot work. Being
 * offline is not counted: that is the child's connection, not the server.
 */
export const MAX_SENDS_PER_RECORDING = 2

/**
 * Why a voice question did not become text. Each has its own sentence for
 * the child (`composer.voice.failed.<kind>`).
 *
 * From the backend (`client-error-actions.json`, domain `voice_question`):
 *   notAllowed   403 `voice_questions_not_allowed`: no linked parent has it on (any more)
 *   unsupported  415 `voice_recording_unsupported`: not the 16 kHz mono WAV agreed (a bug here)
 *   tooLarge     413 `voice_recording_too_large`, or over 2 MiB before sending
 *   tooLong      422 `voice_recording_too_long`
 *   unreadable   422 `voice_recording_unreadable`
 *   silent       422 `voice_recording_silent`, or nothing recorded or heard
 *   dailyLimit   429 `voice_transcription_daily_limit`: today's 30 are used
 *   unavailable  503 `voice_transcription_unavailable`: try again shortly, once
 *   refused      502 `voice_transcription_refused`: the model refused it; not for retrying (stoa-backend#542)
 *   offline      the request did not reach the server
 *   failed       anything else
 *   gaveUp       the same recording failed `MAX_SENDS_PER_RECORDING` times
 * From the browser:
 *   micBlocked   the microphone was refused (by the child or the browser's settings)
 *   micMissing   no microphone, or it is busy elsewhere
 *   recorder     the recorder broke off
 */
export type VoiceFailureKind =
  | 'notAllowed'
  | 'unsupported'
  | 'tooLarge'
  | 'tooLong'
  | 'unreadable'
  | 'silent'
  | 'dailyLimit'
  | 'unavailable'
  | 'refused'
  | 'offline'
  | 'failed'
  | 'gaveUp'
  | 'micBlocked'
  | 'micMissing'
  | 'recorder'

/**
 * What "try again" does after each: send the same recording again (the
 * server could not take it just now), record a new one (this recording was
 * the problem), or nothing (typing is the way on).
 */
export type VoiceRetry = 'send' | 'record' | null

export const VOICE_RETRY: Record<VoiceFailureKind, VoiceRetry> = {
  notAllowed: null,
  unsupported: null,
  tooLarge: 'record',
  tooLong: 'record',
  unreadable: 'record',
  silent: 'record',
  dailyLimit: null,
  unavailable: 'send',
  refused: null,
  offline: 'send',
  failed: 'send',
  gaveUp: null,
  micBlocked: null,
  micMissing: 'record',
  recorder: 'record',
}

export const VOICE_FAILURE_CODES: Record<string, VoiceFailureKind> = {
  voice_questions_not_allowed: 'notAllowed',
  voice_recording_unsupported: 'unsupported',
  voice_recording_too_large: 'tooLarge',
  voice_recording_too_long: 'tooLong',
  voice_recording_unreadable: 'unreadable',
  voice_recording_silent: 'silent',
  voice_transcription_daily_limit: 'dailyLimit',
  voice_transcription_unavailable: 'unavailable',
  voice_transcription_refused: 'refused',
}

/** A transcription that did not come back as text, and why. */
export class VoiceFailure extends Error {
  readonly kind: VoiceFailureKind
  constructor(kind: VoiceFailureKind) {
    super(`voice question: ${kind}`)
    this.name = 'VoiceFailure'
    this.kind = kind
  }
}

/** The browser's refusal of the microphone, by the DOMException's name. */
export function microphoneFailure(error: unknown): VoiceFailureKind {
  const name = typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : ''
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'micBlocked'
  if (name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError' || name === 'AbortError') return 'micMissing'
  return 'micMissing'
}

/**
 * `text` put where the cursor was (`start`..`end`, a selection is replaced),
 * with a space between it and a word on either side, and where the cursor
 * goes after it.
 */
export function insertAtCursor(
  value: string,
  start: number | null | undefined,
  end: number | null | undefined,
  text: string,
): { value: string; cursor: number } {
  const from = Math.max(0, Math.min(start ?? value.length, value.length))
  const to = Math.max(from, Math.min(end ?? from, value.length))
  const before = value.slice(0, from)
  const after = value.slice(to)
  const lead = before.length > 0 && !/\s$/.test(before) ? ' ' : ''
  const trail = after.length > 0 && !/^\s/.test(after) ? ' ' : ''
  const inserted = `${lead}${text}${trail}`
  return { value: `${before}${inserted}${after}`, cursor: before.length + lead.length + text.length }
}

/** `65` -> `1:05`. */
export function clockOf(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
