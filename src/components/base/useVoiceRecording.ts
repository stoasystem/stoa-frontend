import { useCallback, useEffect, useRef, useState } from 'react'
import {
  declaredType,
  MAX_RECORDING_BYTES,
  MAX_RECORDING_SECONDS,
  microphoneFailure,
  RECORDING_BITS_PER_SECOND,
  VOICE_RETRY,
  VoiceFailure,
  type VoiceFailureKind,
  type VoiceRetry,
} from '@/lib/voiceRecording'

/**
 * A composer that records voice questions (#697): how to turn a recording
 * into text, and the recording type this browser makes. The host gives it
 * only when the student may (a linked parent turned it on) and the browser
 * can; without it the microphone says how to dictate, as before (#515).
 */
export interface VoiceInput {
  /** The recorder's type, from `recordingTypeHere()`. */
  recordingType: string
  /** The recording as text; a refusal throws a `VoiceFailure`. */
  transcribe: (recording: Blob, signal: AbortSignal) => Promise<string>
  /** The backend said voice questions are off for this student (any more). */
  onNotAllowed?: () => void
}

export type VoiceState =
  | { phase: 'idle' }
  | { phase: 'starting' }
  | { phase: 'listening'; seconds: number }
  | { phase: 'transcribing' }
  | { phase: 'failed'; failure: VoiceFailureKind; retry: VoiceRetry }

type Session = {
  recorder: MediaRecorder
  stream: MediaStream
  chunks: Blob[]
  timers: number[]
  discarded: boolean
}

const failed = (failure: VoiceFailureKind): VoiceState => ({ phase: 'failed', failure, retry: VOICE_RETRY[failure] })

/**
 * Press to start, press again to stop (no holding: a child's thumb slips,
 * and a screen reader cannot hold). The recording stops itself at the
 * backend's minute. Stopped, it goes to `transcribe`, and its text goes to
 * `onText`, which puts it in the field; nothing is sent. A failure leaves the
 * field as it was.
 *
 * The recording lives only in this tab's memory: kept after a failure the
 * server may get over (`retry: 'send'`), so "try again" needs no new
 * recording, and dropped on success, on "type instead" and when the
 * composer goes away.
 */
export function useVoiceRecording(voice: VoiceInput | undefined, onText: (text: string) => void) {
  const [state, setState] = useState<VoiceState>({ phase: 'idle' })
  /** The microphone was refused: from here on the microphone says how to dictate. */
  const [micBlocked, setMicBlocked] = useState(false)
  const session = useRef<Session | null>(null)
  const kept = useRef<Blob | null>(null)
  const inFlight = useRef<AbortController | null>(null)
  const latest = useRef({ voice, onText })
  useEffect(() => {
    latest.current = { voice, onText }
  })

  const release = useCallback((current: Session) => {
    current.timers.forEach((timer) => window.clearTimeout(timer))
    current.timers = []
    current.stream.getTracks().forEach((track) => track.stop())
  }, [])

  /** Everything put away: the recorder, the microphone, a request on its way, the kept recording. */
  const reset = useCallback(() => {
    const current = session.current
    session.current = null
    if (current) {
      current.discarded = true
      release(current)
      if (current.recorder.state !== 'inactive') {
        try {
          current.recorder.stop()
        } catch {
          // Already stopping.
        }
      }
    }
    inFlight.current?.abort()
    inFlight.current = null
    kept.current = null
  }, [release])

  useEffect(() => reset, [reset])

  const send = useCallback(async (recording: Blob) => {
    const voiceNow = latest.current.voice
    if (!voiceNow) return
    if (recording.size === 0) {
      setState(failed('silent'))
      return
    }
    // Checked here too: a recording the backend would refuse is not sent.
    if (recording.size > MAX_RECORDING_BYTES) {
      kept.current = null
      setState(failed('tooLarge'))
      return
    }
    kept.current = recording
    setState({ phase: 'transcribing' })
    const controller = new AbortController()
    inFlight.current = controller
    let text: string
    try {
      text = (await voiceNow.transcribe(recording, controller.signal)).trim()
    } catch (error) {
      if (controller.signal.aborted) return
      inFlight.current = null
      const failure = error instanceof VoiceFailure ? error.kind : 'failed'
      if (VOICE_RETRY[failure] !== 'send') kept.current = null
      if (failure === 'notAllowed') latest.current.voice?.onNotAllowed?.()
      setState(failed(failure))
      return
    }
    if (controller.signal.aborted) return
    inFlight.current = null
    kept.current = null
    if (!text) {
      setState(failed('silent'))
      return
    }
    latest.current.onText(text)
    setState({ phase: 'idle' })
  }, [])

  const stop = useCallback(() => {
    const current = session.current
    if (!current || current.recorder.state === 'inactive') return
    try {
      current.recorder.stop()
    } catch {
      release(current)
      session.current = null
      setState(failed('recorder'))
    }
  }, [release])

  const start = useCallback(async () => {
    const voiceNow = latest.current.voice
    if (!voiceNow || session.current) return
    reset()
    setState({ phase: 'starting' })
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      const failure = microphoneFailure(error)
      if (failure === 'micBlocked') setMicBlocked(true)
      setState(failed(failure))
      return
    }
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: voiceNow.recordingType,
        audioBitsPerSecond: RECORDING_BITS_PER_SECOND,
      })
    } catch {
      stream.getTracks().forEach((track) => track.stop())
      setState(failed('unsupported'))
      return
    }
    const current: Session = { recorder, stream, chunks: [], timers: [], discarded: false }
    session.current = current
    recorder.addEventListener('dataavailable', (event: BlobEvent) => {
      if (event.data && event.data.size > 0) current.chunks.push(event.data)
    })
    recorder.addEventListener('error', () => {
      if (current.discarded) return
      current.discarded = true
      release(current)
      if (session.current === current) session.current = null
      setState(failed('recorder'))
    })
    recorder.addEventListener('stop', () => {
      release(current)
      if (session.current === current) session.current = null
      if (current.discarded) return
      const type = declaredType(recorder.mimeType || current.chunks[0]?.type, voiceNow.recordingType)
      void send(new Blob(current.chunks, { type }))
    })
    try {
      recorder.start()
    } catch {
      current.discarded = true
      release(current)
      session.current = null
      setState(failed('recorder'))
      return
    }
    const startedAt = Date.now()
    setState({ phase: 'listening', seconds: 0 })
    current.timers.push(
      window.setInterval(() => {
        const seconds = Math.min(MAX_RECORDING_SECONDS, Math.floor((Date.now() - startedAt) / 1000))
        setState((now) => (now.phase === 'listening' && now.seconds !== seconds ? { phase: 'listening', seconds } : now))
      }, 250),
      // The backend's minute: the recorder stops itself and the recording goes as it is.
      window.setTimeout(() => stop(), MAX_RECORDING_SECONDS * 1000),
    )
  }, [release, reset, send, stop])

  /** "Try again": the same recording once more, or a new one, as the failure allows. */
  const retry = useCallback(() => {
    if (state.phase !== 'failed' || !state.retry) return
    if (state.retry === 'send' && kept.current) {
      void send(kept.current)
      return
    }
    void start()
  }, [send, start, state])

  /** Put it all away: the child types instead. */
  const dismiss = useCallback(() => {
    reset()
    setState({ phase: 'idle' })
  }, [reset])

  return { state, micBlocked, start, stop, retry, dismiss }
}
