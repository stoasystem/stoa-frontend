import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceConnector, type VoiceLink } from '@/features/classroom/classroomVoice'
import type { ClassroomPass } from '@/types/classroom'

/**
 * - `connecting`: joining the room, asking for the microphone.
 * - `connected`: in the room; the microphone may be on or off.
 * - `micDenied`: in the room, heard, but the browser refused the microphone.
 * - `failed`: the room could not be joined; the whiteboard and chat still work.
 */
export type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'micDenied' | 'failed'

export type ClassroomVoice = {
  status: VoiceStatus
  micOn: boolean
  toggleMic: () => void
  /** Whoever else is in the room, by the name their token carries. */
  remoteName: string | null
  remoteSpeaking: boolean
}

function looksLikePermission(error: unknown) {
  const name = error instanceof Error ? error.name : ''
  const text = error instanceof Error ? error.message : String(error ?? '')
  return name === 'NotAllowedError' || /permission|not ?allowed/i.test(text)
}

/**
 * The classroom's voice, joined as soon as there is a seat and left with the
 * page (#696). Audio only; the microphone starts on.
 */
export function useClassroomVoice(voice: ClassroomPass['voice'] | undefined): ClassroomVoice {
  const connect = useVoiceConnector()
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [micOn, setMicOn] = useState(true)
  const [remoteName, setRemoteName] = useState<string | null>(null)
  const [remoteSpeaking, setRemoteSpeaking] = useState(false)
  const link = useRef<VoiceLink | null>(null)
  const roomUrl = voice?.roomUrl
  const token = voice?.token

  useEffect(() => {
    if (!roomUrl || !token) return
    let live = true
    let joined: VoiceLink | null = null
    setStatus('connecting')
    setMicOn(true)
    connect(
      { roomUrl, token },
      {
        onRemote: (remote) => live && setRemoteName(remote?.name ?? null),
        onRemoteSpeaking: (speaking) => live && setRemoteSpeaking(speaking),
        onMicDenied: () => {
          if (!live) return
          setStatus('micDenied')
          setMicOn(false)
        },
        onFailed: () => live && setStatus('failed'),
      },
    ).then(
      (made) => {
        joined = made
        if (!live) {
          void made.leave()
          return
        }
        link.current = made
        setStatus((current) => (current === 'connecting' ? 'connected' : current))
      },
      (error: unknown) => {
        if (!live) return
        if (looksLikePermission(error)) {
          setStatus('micDenied')
          setMicOn(false)
        } else {
          setStatus('failed')
        }
      },
    )
    return () => {
      live = false
      link.current = null
      setRemoteName(null)
      setRemoteSpeaking(false)
      if (joined) void joined.leave()
    }
  }, [connect, roomUrl, token])

  const toggleMic = useCallback(() => {
    if (status !== 'connected') return
    link.current?.setMic(!micOn)
    setMicOn(!micOn)
  }, [micOn, status])

  return { status, micOn, toggleMic, remoteName, remoteSpeaking }
}
