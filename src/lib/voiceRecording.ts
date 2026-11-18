/**
 * A voice question (#697): the child presses the microphone, speaks, presses
 * it again, and STOA's backend turns the recording into text
 * (`POST /students/me/voice-questions/transcriptions`, stoa-backend#469).
 *
 * The backend takes the recording as the browser's MediaRecorder made it,
 * never transcoded: WebM or Ogg with Opus, or MP4 with AAC, at most 2 MiB and
 * 60 seconds (`voice_audio.py`). So the recorder is asked for one of those
 * three, in the order below, and a browser that offers none of them gets the
 * device's own dictation instead (#515), as before.
 */

/** The longest recording the backend takes; the recorder stops itself here. */
export const MAX_RECORDING_SECONDS = 60
/** The largest recording the backend takes (`MAX_BYTES`). */
export const MAX_RECORDING_BYTES = 2 * 1024 * 1024
/**
 * Speech needs little: at 32 kbit/s a full minute is about 240 KB, far under
 * the 2 MiB the backend takes. A browser that ignores the hint is still
 * checked before anything is sent.
 */
export const RECORDING_BITS_PER_SECOND = 32_000

/*
 * WebM first: Chrome, Edge and Firefox record it. MP4 with AAC is what Safari
 * records (macOS and iOS). Chrome also offers `audio/mp4`, but with Opus in
 * it rather than AAC, which is not what the backend was built for; asking for
 * WebM first keeps Chrome on WebM. Ogg is Firefox's other one.
 */
export const RECORDING_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
] as const

/** The media types the backend accepts, parameters (`;codecs=`) aside (`DECLARED_TYPES`). */
const ACCEPTED_MEDIA_TYPES = new Set([
  'audio/webm',
  'video/webm',
  'audio/ogg',
  'application/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'video/mp4',
])

/** `audio/webm;codecs=opus` -> `audio/webm`. */
export function mediaTypeOf(type: string): string {
  return type.split(';', 1)[0].trim().toLowerCase()
}

/** The first of `RECORDING_TYPES` this browser's MediaRecorder can make, or `null`. */
export function pickRecordingType(isTypeSupported: (type: string) => boolean): string | null {
  for (const type of RECORDING_TYPES) {
    try {
      if (isTypeSupported(type)) return type
    } catch {
      // An old engine that throws for an unknown type has not got it.
    }
  }
  return null
}

/**
 * The type to declare for a finished recording: what the recorder says it
 * made, when that is one the backend takes, else what it was asked for. The
 * backend checks the declared type against the bytes, so it must be the
 * recorder's own, never a guess.
 */
export function declaredType(recorderType: string | undefined, asked: string): string {
  if (recorderType && ACCEPTED_MEDIA_TYPES.has(mediaTypeOf(recorderType))) return recorderType
  return asked
}

interface RecordingWindow {
  MediaRecorder?: { isTypeSupported?: (type: string) => boolean }
  navigator?: { mediaDevices?: { getUserMedia?: unknown } }
}

/** The recording type this browser would use, or `null` when it cannot record a voice question. */
export function recordingTypeHere(
  win: RecordingWindow | undefined = typeof window === 'undefined' ? undefined : (window as unknown as RecordingWindow),
): string | null {
  const recorder = win?.MediaRecorder
  if (!recorder || typeof recorder.isTypeSupported !== 'function') return null
  if (typeof win?.navigator?.mediaDevices?.getUserMedia !== 'function') return null
  return pickRecordingType((type) => recorder.isTypeSupported!(type))
}

/**
 * Why a voice question did not become text. Each has its own sentence for
 * the child (`composer.voice.failed.<kind>`).
 *
 * From the backend (`client-error-actions.json`, domain `voice_question`):
 *   notAllowed   403 `voice_questions_not_allowed`: no linked parent has it on (any more)
 *   unsupported  415 `voice_recording_unsupported`
 *   tooLarge     413 `voice_recording_too_large`, or over 2 MiB before sending
 *   tooLong      422 `voice_recording_too_long`
 *   unreadable   422 `voice_recording_unreadable`
 *   silent       422 `voice_recording_silent`, or nothing recorded or heard
 *   dailyLimit   429 `voice_transcription_daily_limit`: today's 30 are used
 *   unavailable  503 `voice_transcription_unavailable`: try again shortly
 *   offline      the request did not reach the server
 *   failed       anything else
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
  | 'offline'
  | 'failed'
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
  offline: 'send',
  failed: 'send',
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
