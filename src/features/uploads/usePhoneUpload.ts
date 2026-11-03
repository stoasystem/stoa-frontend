import { useCallback, useEffect, useRef, useState } from 'react'
import { phoneUploadProblemFor } from '@/services/files/attachmentProblems'
import { prepareImage } from '@/services/files/prepareImage'
import { redeemUploadCode, sendWithUploadToken } from '@/services/files/uploadCodeApi'
import { isPreparedImage, rejectionFor, uploadRejectionFor } from '@/services/files/uploadLimits'
import type { UploadCodeRedemption } from '@/types/file'

/**
 * Why the phone stopped, as the sentence the page says:
 *
 * - `codeInvalid`: the code is past its ten minutes, already used, or not one.
 * - `rateLimited`: too many tries from here; wait, then try again.
 * - `blocked`: moderation refused the picture (#138).
 * - `tooLarge` / `unsupported` / `empty` / `unreadable`: this photo cannot go;
 *   the code is still unspent, so another one can.
 * - `retry`: the line or the server failed; trying again sends the same photo.
 * - `newCode`: the code is spent and its upload cannot finish.
 */
export type PhoneUploadStop =
  | 'codeInvalid'
  | 'rateLimited'
  | 'blocked'
  | 'tooLarge'
  | 'unsupported'
  | 'empty'
  | 'unreadable'
  | 'retry'
  | 'newCode'

/** What the student can do next: choose another photo, try again, or nothing here. */
export type PhoneUploadNext = 'choose' | 'retry' | 'none'

export type PhoneUploadPhase =
  | { step: 'choose' }
  | { step: 'sending' }
  | { step: 'sent' }
  | { step: 'stopped'; stop: PhoneUploadStop; next: PhoneUploadNext }

/**
 * Where an error leaves the phone. `redeemed` says the code was spent on this
 * photo: from then on the photo cannot be swapped for another, and only the
 * token it was spent for can finish it.
 */
function stopFor(error: unknown, redeemed: boolean): { stop: PhoneUploadStop; next: PhoneUploadNext } {
  const problem = phoneUploadProblemFor(error)
  switch (problem) {
    case 'codeInvalid':
      return { stop: 'codeInvalid', next: 'none' }
    case 'rateLimited':
      return { stop: 'rateLimited', next: 'retry' }
    case 'blocked':
      return { stop: 'blocked', next: 'none' }
    case 'tooLarge':
    case 'unsupported':
    case 'empty':
    case 'unreadable':
      // Refused before the code was spent (the backend checks a photo first),
      // so another photo can still go.
      return redeemed ? { stop: 'newCode', next: 'none' } : { stop: problem, next: 'choose' }
    case 'unavailable':
    case 'failed':
      return { stop: 'retry', next: 'retry' }
    default:
      // `expired`, `quota`, `tooMany`: the upload the code was spent on is gone
      // or cannot be made.
      return { stop: 'newCode', next: 'none' }
  }
}

/**
 * The phone's side of a photo sent by QR (#514): choose or take one photo,
 * prepare it like any other (#508), spend the code on it, send it.
 *
 * The code is spent once. What `redeem` hands back is held here and every
 * later step -- each part, the completion, and every retry of them -- goes
 * with its token; the code is never presented again (stoa-backend#171).
 */
export function usePhoneUpload(code: string) {
  const [phase, setPhase] = useState<PhoneUploadPhase>({ step: 'choose' })
  const redemption = useRef<UploadCodeRedemption | null>(null)
  const photo = useRef<File | null>(null)
  const running = useRef(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  const run = useCallback(async () => {
    const prepared = photo.current
    if (!prepared || running.current) return
    running.current = true
    controller.current = new AbortController()
    const { signal } = controller.current
    setPhase({ step: 'sending' })
    try {
      if (!redemption.current) redemption.current = await redeemUploadCode(code, prepared, signal)
      await sendWithUploadToken(redemption.current, prepared, signal)
      if (!signal.aborted) setPhase({ step: 'sent' })
    } catch (error) {
      if (!signal.aborted) setPhase({ step: 'stopped', ...stopFor(error, redemption.current !== null) })
    } finally {
      running.current = false
    }
  }, [code])

  const choose = useCallback(
    async (file: File | undefined) => {
      // Spent on one photo, the code cannot carry another.
      if (!file || redemption.current || running.current) return
      const rejection = isPreparedImage(file.name) ? rejectionFor(file) : 'unsupported'
      if (rejection) {
        setPhase({ step: 'stopped', stop: rejection, next: 'choose' })
        return
      }
      setPhase({ step: 'sending' })
      let prepared: File
      try {
        prepared = await prepareImage(file)
      } catch (error) {
        setPhase({ step: 'stopped', ...stopFor(error, false) })
        return
      }
      // At 1568 px a side a JPEG cannot come near 10 MB; one that does is not sent.
      if (uploadRejectionFor(prepared)) {
        setPhase({ step: 'stopped', stop: 'tooLarge', next: 'choose' })
        return
      }
      photo.current = prepared
      await run()
    },
    [run],
  )

  return { phase, choose, retry: run }
}
