/*
 * The microphone, before a student enters the classroom (#705). The classroom
 * is a voice call with the teacher, so the student is told first that the
 * browser will ask for the microphone, and only then is it asked.
 *
 * - `granted`: allowed before; nothing to say, straight in.
 * - `prompt`: not asked yet, or the browser cannot tell (it has no
 *   `navigator.permissions`, or does not know the name `microphone`).
 * - `denied`: the browser refuses it; only its own settings change that.
 *
 * Inside the classroom, a microphone refused all the same is still said there
 * (#696, `micDenied`): this only comes first.
 *
 * In the design preview (dev server) `?micPermission=granted|prompt|denied`
 * stands in for the browser, for screenshots: then nothing real is asked.
 */
export type MicPermission = 'granted' | 'prompt' | 'denied'

function previewMicPermission(): MicPermission | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null
  const asked = new URLSearchParams(window.location.search).get('micPermission')
  return asked === 'granted' || asked === 'prompt' || asked === 'denied' ? asked : null
}

/** Where the browser stands on this site's microphone; `prompt` when it cannot say. */
export async function readMicPermission(): Promise<MicPermission> {
  const preview = previewMicPermission()
  if (preview) return preview
  try {
    const status = await navigator.permissions?.query({ name: 'microphone' as PermissionName })
    if (status?.state === 'granted' || status?.state === 'denied') return status.state
  } catch {
    // A browser that does not know the name: it asks when the classroom does.
  }
  return 'prompt'
}

/**
 * Asks the browser for the microphone now, and lets it go at once: the
 * classroom takes it again when it joins the call. Whether it was given,
 * never thrown.
 */
export async function askForMicrophone(): Promise<boolean> {
  const preview = previewMicPermission()
  if (preview) return preview !== 'denied'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    for (const track of stream.getTracks()) track.stop()
    return true
  } catch {
    return false
  }
}
