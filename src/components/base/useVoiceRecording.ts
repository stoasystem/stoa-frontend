import { useCallback, useEffect, useRef, useState } from 'react'
import monoCaptureUrl from '@/lib/monoCapture.worklet.ts?worker&url'
import {
  MAX_RECORDING_BYTES,
  MAX_RECORDING_SECONDS,
  MAX_SENDS_PER_RECORDING,
  microphoneFailure,
  VOICE_RETRY,
  VoiceFailure,
  type VoiceFailureKind,
  type VoiceRetry,
} from '@/lib/voiceRecording'
import { Downsampler, encodeWav, WAV_SAMPLE_RATE } from '@/lib/wav'

/**
 * A composer that records voice questions (#697): how to turn a recording
 * into text. The host gives it only when the student may (a linked parent
 * turned it on) and the browser can (`canRecordVoiceHere`); without it the
 * microphone says how to dictate, as before (#515).
 */
export interface VoiceInput {
  /** The recording (16 kHz mono WAV) as text; a refusal throws a `VoiceFailure`. */
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

/** The processor `monoCapture.worklet.ts` registers. */
const CAPTURE_PROCESSOR = 'stoa-mono-capture'

type Session = {
  context: AudioContext
  stream: MediaStream | null
  source: MediaStreamAudioSourceNode | null
  node: AudioWorkletNode | null
  pcm: Downsampler
  timers: number[]
  /** Put away: whatever it still hears or finishes is dropped. */
  discarded: boolean
}

type Kept = { recording: Blob; sends: number }

const failed = (failure: VoiceFailureKind): VoiceState => ({ phase: 'failed', failure, retry: VOICE_RETRY[failure] })

/**
 * Press to start, press again to stop (no holding: a child's thumb slips,
 * and a screen reader cannot hold). The recording stops itself at the
 * backend's minute. Stopped, it is written as a 16 kHz mono WAV (#726: the
 * speech model takes only mp3 and wav) and goes to `transcribe`, and its text
 * goes to `onText`, which puts it in the field; nothing is sent. A failure
 * leaves the field as it was.
 *
 * The microphone is heard through Web Audio: an AudioContext, made in the
 * press itself (Safari and iOS start one only in a user gesture), and an
 * audio worklet that hands its samples to the page.
 *
 * The recording lives only in this tab's memory: kept after a failure the
 * server may get over (`retry: 'send'`), so "try again" needs no new
 * recording, but sent at most `MAX_SENDS_PER_RECORDING` times unless the
 * child was offline; dropped on
 * success, on "type instead" and when the composer goes away.
 */
export function useVoiceRecording(voice: VoiceInput | undefined, onText: (text: string) => void) {
  const [state, setState] = useState<VoiceState>({ phase: 'idle' })
  /** The microphone was refused: from here on the microphone says how to dictate. */
  const [micBlocked, setMicBlocked] = useState(false)
  const session = useRef<Session | null>(null)
  const kept = useRef<Kept | null>(null)
  const inFlight = useRef<AbortController | null>(null)
  const latest = useRef({ voice, onText })
  useEffect(() => {
    latest.current = { voice, onText }
  })

  /** The microphone, the worklet and the audio context let go of; the samples stay. */
  const release = useCallback((current: Session) => {
    current.timers.forEach((timer) => window.clearTimeout(timer))
    current.timers = []
    if (current.node) current.node.port.onmessage = null
    try {
      current.source?.disconnect()
      current.node?.disconnect()
    } catch {
      // Already disconnected.
    }
    current.stream?.getTracks().forEach((track) => track.stop())
    if (current.context.state !== 'closed') void current.context.close().catch(() => {})
  }, [])

  /** Everything put away: the recording, the microphone, a request on its way, the kept recording. */
  const reset = useCallback(() => {
    const current = session.current
    session.current = null
    if (current) {
      current.discarded = true
      release(current)
    }
    inFlight.current?.abort()
    inFlight.current = null
    kept.current = null
  }, [release])

  useEffect(() => reset, [reset])

  const send = useCallback(async (recording: Blob, sendsBefore: number) => {
    const voiceNow = latest.current.voice
    if (!voiceNow) return
    // Checked here too: a recording the backend would refuse is not sent.
    if (recording.size > MAX_RECORDING_BYTES) {
      kept.current = null
      setState(failed('tooLarge'))
      return
    }
    const sends = sendsBefore + 1
    kept.current = { recording, sends }
    setState({ phase: 'transcribing' })
    const controller = new AbortController()
    inFlight.current = controller
    let text: string
    try {
      text = (await voiceNow.transcribe(recording, controller.signal)).trim()
    } catch (error) {
      if (controller.signal.aborted) return
      inFlight.current = null
      let failure: VoiceFailureKind = error instanceof VoiceFailure ? error.kind : 'failed'
      // The same words failed again: typing is the way on, not another press.
      if (VOICE_RETRY[failure] === 'send' && failure !== 'offline' && sends >= MAX_SENDS_PER_RECORDING) failure = 'gaveUp'
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

  /** Stops listening and sends what was heard. */
  const stop = useCallback(() => {
    const current = session.current
    if (!current || current.discarded || !current.node) return
    session.current = null
    current.discarded = true
    release(current)
    if (current.pcm.length === 0) {
      setState(failed('silent'))
      return
    }
    void send(encodeWav(current.pcm.samples(), WAV_SAMPLE_RATE), 0)
  }, [release, send])

  const start = useCallback(async () => {
    if (!latest.current.voice || session.current) return
    reset()
    setState({ phase: 'starting' })

    // In the press itself, before anything is awaited: Safari and iOS start
    // an AudioContext only in a user gesture.
    let context: AudioContext
    try {
      context = new AudioContext()
    } catch {
      setState(failed('unsupported'))
      return
    }
    void context.resume().catch(() => {})
    const current: Session = {
      context,
      stream: null,
      source: null,
      node: null,
      pcm: new Downsampler(context.sampleRate, MAX_RECORDING_SECONDS * WAV_SAMPLE_RATE),
      timers: [],
      discarded: false,
    }
    session.current = current
    const giveUp = (failure: VoiceFailureKind) => {
      current.discarded = true
      release(current)
      if (session.current === current) session.current = null
      setState(failed(failure))
    }

    try {
      current.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      if (current.discarded) return
      const failure = microphoneFailure(error)
      if (failure === 'micBlocked') setMicBlocked(true)
      giveUp(failure)
      return
    }
    // Put away while the browser asked ("type instead", or the composer went).
    if (current.discarded) {
      release(current)
      return
    }

    try {
      await context.audioWorklet.addModule(monoCaptureUrl)
      if (current.discarded) return
      current.source = context.createMediaStreamSource(current.stream)
      current.node = new AudioWorkletNode(context, CAPTURE_PROCESSOR, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      })
      current.node.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (current.discarded || !(event.data instanceof Float32Array)) return
        // The minute is up when the samples say so, not when a timer gets round to it.
        if (current.pcm.push(event.data)) stop()
      }
      current.node.onprocessorerror = () => {
        if (!current.discarded) giveUp('recorder')
      }
      current.source.connect(current.node)
      // Connected to the speakers so every engine runs it; it writes only silence.
      current.node.connect(context.destination)
      // Not awaited: where the press no longer counts (iOS), it may never settle.
      void context.resume().catch(() => {})
    } catch {
      if (!current.discarded) giveUp('recorder')
      return
    }
    if (current.discarded) return

    const startedAt = Date.now()
    setState({ phase: 'listening', seconds: 0 })
    current.timers.push(
      window.setInterval(() => {
        const seconds = Math.min(MAX_RECORDING_SECONDS, Math.floor((Date.now() - startedAt) / 1000))
        setState((now) => (now.phase === 'listening' && now.seconds !== seconds ? { phase: 'listening', seconds } : now))
      }, 250),
      // The backend's minute, should the samples stop coming: the recording goes as it is.
      window.setTimeout(() => stop(), MAX_RECORDING_SECONDS * 1000),
    )
  }, [release, reset, stop])

  /** "Try again": the same recording once more, or a new one, as the failure allows. */
  const retry = useCallback(() => {
    if (state.phase !== 'failed' || !state.retry) return
    if (state.retry === 'send' && kept.current) {
      void send(kept.current.recording, kept.current.sends)
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
