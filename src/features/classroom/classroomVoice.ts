/*
 * The classroom's voice (#696): student and teacher talk, audio only, through
 * a Daily room the backend opens and signs a token for (stoa-backend#467).
 *
 * The seam is a connector in a React context, as Ask's server is
 * (`AskServerContext`): the default joins the room with Daily's call object,
 * a test or the design preview puts a stand-in in its place. Daily's own
 * prebuilt screen is not used; the classroom draws its own bar.
 */
import { createContext, useContext } from 'react'
import type { DailyCall, DailyEventObjectCameraError, DailyParticipant } from '@daily-co/daily-js'

/** What the voice room says while the classroom is open. */
export type VoiceEvents = {
  /** Whoever else is in the room: their display name, or `null` once nobody is. */
  onRemote: (remote: { name: string } | null) => void
  /** Whether someone else is speaking now. */
  onRemoteSpeaking: (speaking: boolean) => void
  /** The browser refused the microphone: the room is still heard, nothing is sent. */
  onMicDenied: () => void
  /** The room could not be joined, or dropped the call. */
  onFailed: () => void
}

/** A joined room. */
export type VoiceLink = {
  setMic: (on: boolean) => void
  leave: () => Promise<void>
}

export type VoiceConnector = (room: { roomUrl: string; token: string }, events: VoiceEvents) => Promise<VoiceLink>

/** Louder than this, on Daily's 0-1 scale, counts as speaking. */
const SPEAKING_LEVEL = 0.03

/*
 * Daily allows one call object per page. A room left as the classroom closes
 * (or as StrictMode mounts it twice) is destroyed before the next is made.
 */
let previous: Promise<void> = Promise.resolve()

function remoteOf(call: DailyCall): DailyParticipant | undefined {
  return Object.values(call.participants()).find((participant) => !participant.local)
}

/** The default: Daily's call object, microphone on, never a camera. */
export const dailyVoiceConnector: VoiceConnector = async ({ roomUrl, token }, events) => {
  await previous
  const { default: Daily } = await import('@daily-co/daily-js')
  const call = Daily.createCallObject({
    audioSource: true,
    videoSource: false,
    subscribeToTracksAutomatically: true,
    // Its call bundle by a <script> from the room's domain, not fetched and
    // eval'd: the app's content security policy (#533) has no 'unsafe-eval'.
    dailyConfig: { avoidEval: true },
  })
  const players = new Map<string, HTMLAudioElement>()

  // The call object plays nothing by itself: each remote microphone gets an <audio>.
  const play = (participant: DailyParticipant | undefined) => {
    if (!participant || participant.local) return
    const track = participant.tracks.audio.persistentTrack
    const existing = players.get(participant.session_id)
    if (!track) return
    if (existing?.srcObject instanceof MediaStream && existing.srcObject.getAudioTracks()[0] === track) return
    const player = existing ?? new Audio()
    player.autoplay = true
    player.srcObject = new MediaStream([track])
    void player.play().catch(() => undefined)
    players.set(participant.session_id, player)
  }
  const stop = (sessionId: string) => {
    const player = players.get(sessionId)
    if (!player) return
    player.pause()
    player.srcObject = null
    players.delete(sessionId)
  }
  const sayRemote = () => {
    const remote = remoteOf(call)
    events.onRemote(remote ? { name: remote.user_name } : null)
  }

  call.on('participant-joined', (event) => {
    play(event?.participant)
    sayRemote()
  })
  call.on('participant-updated', (event) => play(event?.participant))
  call.on('track-started', (event) => play(event?.participant ?? undefined))
  call.on('participant-left', (event) => {
    if (event?.participant) stop(event.participant.session_id)
    sayRemote()
    events.onRemoteSpeaking(false)
  })
  call.on('remote-participants-audio-level', (event) => {
    const levels = Object.values(event?.participantsAudioLevel ?? {})
    events.onRemoteSpeaking(levels.some((level) => level > SPEAKING_LEVEL))
  })
  call.on('camera-error', (event?: DailyEventObjectCameraError) => {
    if (event?.error?.type === 'permissions') events.onMicDenied()
  })
  call.on('error', () => events.onFailed())

  try {
    await call.join({ url: roomUrl, token, startVideoOff: true })
    sayRemote()
    for (const participant of Object.values(call.participants())) play(participant)
    await call.startRemoteParticipantsAudioLevelObserver(200).catch(() => undefined)
  } catch (error) {
    await call.destroy().catch(() => undefined)
    throw error
  }

  return {
    setMic: (on) => {
      call.setLocalAudio(on)
    },
    leave: () => {
      for (const sessionId of [...players.keys()]) stop(sessionId)
      const left = call
        .leave()
        .catch(() => undefined)
        .then(() => call.destroy())
        .catch(() => undefined)
      previous = left
      return left
    },
  }
}

export const ClassroomVoiceContext = createContext<VoiceConnector>(dailyVoiceConnector)

/** Put another voice behind the classroom: `<ClassroomVoiceProvider value={connector}>`. */
export const ClassroomVoiceProvider = ClassroomVoiceContext.Provider

export function useVoiceConnector(): VoiceConnector {
  return useContext(ClassroomVoiceContext)
}
