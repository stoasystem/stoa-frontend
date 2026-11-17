import { ApiError, httpClient } from '@/services/api/httpClient'
import { VOICE_FAILURE_CODES, VoiceFailure, type VoiceFailureKind } from '@/lib/voiceRecording'

/** Whether this student may ask by voice: off with no linked parent, or until one allows it (#697). */
export type StudentVoiceQuestions = { allowed: boolean }

export async function getMyVoiceQuestions() {
  const response = await httpClient.get<StudentVoiceQuestions>('/students/me/voice-questions')
  return response.data
}

/*
 * Long enough for a minute of speech to go to Ireland and come back as text
 * (stoa-backend#469). How long Voxtral really takes is not measured yet
 * (stoa-backend#478); until it is, the child sees "turning it into text" and
 * can stop waiting by typing.
 */
const TRANSCRIPTION_TIMEOUT_MS = 90_000

/**
 * What the child said, as text. The request body is the recording itself,
 * declared with the type the recorder made it in (the backend checks the
 * declared type against the bytes). Any refusal comes back as a
 * `VoiceFailure` with its kind.
 */
export async function transcribeVoiceQuestion(recording: Blob, signal?: AbortSignal): Promise<string> {
  try {
    const response = await httpClient.post<{ text: string }>(
      '/students/me/voice-questions/transcriptions',
      recording,
      { headers: { 'Content-Type': recording.type }, timeout: TRANSCRIPTION_TIMEOUT_MS, signal },
    )
    return typeof response.data?.text === 'string' ? response.data.text : ''
  } catch (error) {
    throw new VoiceFailure(voiceFailureOf(error))
  }
}

/** The kind of a refused transcription, by the backend's code first, then its status. */
export function voiceFailureOf(error: unknown): VoiceFailureKind {
  if (error instanceof VoiceFailure) return error.kind
  if (!(error instanceof ApiError)) return 'failed'
  const known = error.code ? VOICE_FAILURE_CODES[error.code] : undefined
  if (known) return known
  if (error.status === undefined) return 'offline'
  if (error.status === 503 || error.status === 502 || error.status === 504 || error.status === 429) return 'unavailable'
  if (error.status === 415) return 'unsupported'
  if (error.status === 413) return 'tooLarge'
  return 'failed'
}
