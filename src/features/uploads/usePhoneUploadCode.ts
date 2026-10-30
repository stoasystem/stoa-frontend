import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { phoneUploadProblemFor } from '@/services/files/attachmentProblems'
import { createUploadCode, readUploadCode, readUploadCodePhoto } from '@/services/files/uploadCodeApi'
import type { UploadCode, UploadCodeStatus } from '@/types/file'

/** How often the computer asks how far the phone has got. */
export const UPLOAD_CODE_POLL_MS = 2000

/**
 * How long a message may carry an upload: 30 minutes from its intent
 * (`UPLOAD_INTENT_TTL_SECONDS`), which the phone's redemption opened.
 */
const UPLOAD_LIFETIME_MS = 30 * 60 * 1000

/**
 * What the QR card in Ask shows.
 *
 * - `making`: the code is being made.
 * - `unmade`: it could not be; `rateLimited` when too many were made just now.
 * - `waiting`: the QR, and how long it has left.
 * - `uploading`: a phone took the code and is sending its photo.
 * - `ready`: the photo passed; it is shown, and added only if the student says
 *   so. Whoever scans first holds the code (stoa-backend#171, audit item M1).
 * - `failed`: the photo did not arrive, or did not pass.
 * - `expired`: ten minutes went by without a photo.
 */
export type PhoneCodeView =
  | { step: 'making' }
  | { step: 'unmade'; problem: 'rateLimited' | 'failed' }
  | { step: 'waiting'; code: UploadCode; remainingMs: number }
  | { step: 'uploading' }
  | {
      step: 'ready'
      uploadId: string
      /** When a message can no longer carry it. */
      expiresAt: string
      photo?: Blob
      photoFailed: boolean
    }
  | { step: 'failed' }
  | { step: 'expired' }

type Made = 'making' | UploadCode | { problem: 'rateLimited' | 'failed' }

/** One card's code, for the conversation it was made in. */
type Session = { conversationId: string; made: Made; id: number }

let sessions = 0

const isCode = (made: Made | undefined): made is UploadCode => typeof made === 'object' && 'codeId' in made

const stillGoing = (status: UploadCodeStatus | undefined) =>
  status === undefined || status === 'waiting' || status === 'uploading'

/** The time, once a second while `ticking`. */
function useNow(ticking: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!ticking) return undefined
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [ticking])
  return now
}

/**
 * The computer's side of a photo sent by QR (#514), for the conversation open
 * in Ask. A code belongs to the conversation it was made in, so opening
 * another one closes the card; `start` makes a fresh code, also to replace one
 * that ran out.
 */
export function usePhoneUploadCode(conversationId: string | null) {
  const [session, setSession] = useState<Session | null>(null)
  const current = session && session.conversationId === conversationId ? session : null
  const code = isCode(current?.made) ? current.made : null

  const start = useCallback(() => {
    if (!conversationId) return
    sessions += 1
    const id = sessions
    // A reply for a card since closed or renewed is dropped.
    const settle = (made: Made) =>
      setSession((now) => (now?.id === id ? { ...now, made } : now))
    setSession({ conversationId, made: 'making', id })
    createUploadCode(conversationId).then(settle, (error: unknown) =>
      settle({ problem: phoneUploadProblemFor(error) === 'rateLimited' ? 'rateLimited' : 'failed' }),
    )
  }, [conversationId])

  const close = useCallback(() => setSession(null), [])

  const status = useQuery({
    queryKey: chatQueryKeys.uploadCode(conversationId ?? '', code?.codeId ?? ''),
    queryFn: ({ signal }) => readUploadCode(conversationId ?? '', code?.codeId ?? '', signal),
    enabled: Boolean(conversationId && code),
    refetchInterval: (query) => (stillGoing(query.state.data?.status) ? UPLOAD_CODE_POLL_MS : false),
    refetchIntervalInBackground: true,
    // Each card asks afresh; a code is never shown from a cache.
    gcTime: 0,
  })
  const state = code ? status.data : undefined
  const ready = state?.status === 'ready' && state.uploadId ? state.uploadId : null

  const photo = useQuery({
    queryKey: chatQueryKeys.uploadCodePhoto(conversationId ?? '', code?.codeId ?? ''),
    queryFn: ({ signal }) => readUploadCodePhoto(conversationId ?? '', code?.codeId ?? '', signal),
    enabled: Boolean(conversationId && code && ready),
    // The photo does not change once it has passed.
    staleTime: 'static',
    gcTime: 0,
  })

  const now = useNow(Boolean(code) && stillGoing(state?.status))

  let view: PhoneCodeView | null = null
  if (current) {
    const made = current.made
    if (made === 'making') view = { step: 'making' }
    else if (!isCode(made)) view = { step: 'unmade', problem: made.problem }
    else if (ready) {
      const redeemedAt = state?.redeemedAt ? Date.parse(state.redeemedAt) : now
      view = {
        step: 'ready',
        uploadId: ready,
        expiresAt: new Date(redeemedAt + UPLOAD_LIFETIME_MS).toISOString(),
        photo: photo.data,
        photoFailed: photo.isError,
      }
    } else if (state?.status === 'failed') view = { step: 'failed' }
    else {
      // Until a phone takes the code this is the code's ten minutes; then the
      // phone's upload token's.
      const remainingMs = Date.parse(state?.expiresAt ?? made.expiresAt) - now
      if (state?.status === 'expired' || remainingMs <= 0) view = { step: 'expired' }
      else if (state?.status === 'uploading') view = { step: 'uploading' }
      else view = { step: 'waiting', code: made, remainingMs }
    }
  }

  return { view, start, close }
}
