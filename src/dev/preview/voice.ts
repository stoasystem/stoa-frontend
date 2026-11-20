/*
 * Voice questions in the design preview (#697), and the demo parent who
 * allows them. Dev server only.
 *
 *   ?voice=on              a linked parent allowed the demo student to ask by
 *                          voice; without it they may not, as for any child
 *                          until a parent turns it on, and the microphone only
 *                          says how to dictate (#515)
 *   ?voiceFails=<kind>     the transcription is refused: `unavailable` (503,
 *                          the first time only, so "Try again" goes through),
 *                          `refused` (502, the model refused it), `limit`
 *                          (429), `unsupported` (415), `silent`,
 *                          `tooLong`, `unreadable` (422), `notAllowed` (403)
 *   ?mic=denied            the browser refuses the microphone
 *   ?mic=real              the device's own microphone, not the stand-in
 *   ?role=parent           signed in as the demo parent: the demo student's
 *                          page, /parent/children/demo-student, holds the switch
 *
 * The microphone is a stand-in unless `mic=real`: a quiet tone made by the
 * page's own audio, so the real recorder (Web Audio and its worklet, #726)
 * writes a real WAV without asking for a microphone. The switch the parent
 * sets is the one the student reads, for as long as the page is open.
 */
import { DEMO_STUDENT_ID } from '@/dev/demo/data/student'
import { demo, demoLanguage } from '@/dev/preview/demoSource'
import type { LearningProfile } from '@/types/learningProfile'
import type { ChildLearningSummary, ParentChild } from '@/types/parent'
import type { User } from '@/types/user'

const setting = (name: string) => new URLSearchParams(window.location.search).get(name)

export const previewAsParent = () => setting('role') === 'parent'

/** The demo parent, signed in with `?role=parent`. */
export const demoParent: User = {
  id: 'demo-parent-1',
  name: 'Sandra Keller',
  email: 'sandra.keller@example.com',
  role: 'parent',
  preferredLanguage: 'en',
  preferredLocale: 'en',
  effectiveLocale: 'en',
  supportedLocales: ['de', 'en', 'fr', 'it'],
  emailVerificationStatus: 'verified',
  emailVerificationRequired: false,
  accountActivationStatus: 'active',
  mustChangePassword: false,
  verificationStatus: 'approved',
}

/** The demo parent as `/auth/me` reads them: in the page's language, so a German review stays German. */
export function demoParentNow(): User {
  const language = demoLanguage()
  return { ...demoParent, preferredLanguage: language, preferredLocale: language, effectiveLocale: language }
}

/** The switch for the demo student, as the backend keeps it: off until a parent turns it on. */
let voiceSwitch: { allowed: boolean; changedAt: string | null } | null = null
function voiceSwitchNow() {
  voiceSwitch ??= { allowed: setting('voice') === 'on', changedAt: null }
  return voiceSwitch
}

/** `GET /students/me/voice-questions`. */
export function demoStudentVoiceQuestions() {
  return { allowed: voiceSwitchNow().allowed }
}

/** `GET /parents/me/children/:id/voice-questions`; `null` (404) for a child not the parent's. */
export function demoChildVoiceQuestions(childId: string) {
  if (childId !== DEMO_STUDENT_ID) return null
  const now = voiceSwitchNow()
  return { studentId: childId, allowed: now.allowed, changedAt: now.changedAt, changedByMe: now.changedAt ? true : null }
}

/** `PUT /parents/me/children/:id/voice-questions`. */
export function setDemoChildVoiceQuestions(childId: string, body: unknown) {
  if (childId !== DEMO_STUDENT_ID) return null
  const allowed = typeof body === 'object' && body !== null ? (body as { allowed?: unknown }).allowed : undefined
  if (typeof allowed !== 'boolean') return 'invalid'
  voiceSwitch = { allowed, changedAt: new Date().toISOString() }
  return demoChildVoiceQuestions(childId)
}

/** What the demo student "said", in the page's language. */
const SAID: Record<string, string> = {
  de: 'Wie rechne ich den Sinus von 30 Grad aus?',
  en: 'How do I work out the sine of 30 degrees?',
  fr: 'Comment je calcule le sinus de 30 degrés ?',
  it: 'Come calcolo il seno di 30 gradi?',
}

/** What the backend takes (stoa-backend#542): a WAV, under any of its four names; nothing MediaRecorder makes. */
const ACCEPTED = new Set(['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'])
const FAILS: Record<string, [number, string]> = {
  limit: [429, 'voice_transcription_daily_limit'],
  unavailable: [503, 'voice_transcription_unavailable'],
  refused: [502, 'voice_transcription_refused'],
  unsupported: [415, 'voice_recording_unsupported'],
  silent: [422, 'voice_recording_silent'],
  tooLong: [422, 'voice_recording_too_long'],
  unreadable: [422, 'voice_recording_unreadable'],
  notAllowed: [403, 'voice_questions_not_allowed'],
}
let failedOnce = false

/**
 * The last recording the preview took, for checking a browser's recorder by
 * hand or from a test: `window.__stoaLastVoiceRecording`.
 */
let lastRecording: { type: string; bytes: number; seconds: number } | null = null
Object.defineProperty(window, '__stoaLastVoiceRecording', { get: () => lastRecording, configurable: true })

/** A WAV's length in seconds, read from its header as the backend does; `null` when it is not one. */
async function wavSeconds(body: Blob): Promise<number | null> {
  const head = new DataView(await body.slice(0, 44).arrayBuffer())
  if (head.byteLength < 44) return null
  const tag = (at: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => head.getUint8(at + i)))
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE' || tag(12) !== 'fmt ' || tag(36) !== 'data') return null
  const byteRate = head.getUint32(28, true)
  return byteRate > 0 ? head.getUint32(40, true) / byteRate : null
}

/**
 * `POST /students/me/voice-questions/transcriptions`: the checks the backend
 * makes before the model (on, a type it takes, at most 2 MiB, not empty, a
 * WAV no longer than a minute), a moment's wait so "turning it into text" can
 * be seen, then a fixed sentence.
 */
export async function demoTranscription(body: unknown): Promise<{ text: string } | [number, string]> {
  if (!voiceSwitchNow().allowed) return FAILS.notAllowed
  if (!(body instanceof Blob)) return FAILS.unsupported
  if (!ACCEPTED.has(body.type.split(';', 1)[0].trim().toLowerCase())) return FAILS.unsupported
  if (body.size > 2 * 1024 * 1024) return [413, 'voice_recording_too_large']
  if (body.size === 0) return FAILS.unreadable
  const wav = await wavSeconds(body)
  if (wav === null) return FAILS.unreadable
  if (wav > 60) return FAILS.tooLong
  lastRecording = { type: body.type, bytes: body.size, seconds: wav }
  await new Promise((resolve) => window.setTimeout(resolve, 1_200))
  const fails = setting('voiceFails')
  if (fails && FAILS[fails]) {
    if (fails !== 'unavailable' || !failedOnce) {
      failedOnce = true
      return FAILS[fails]
    }
  }
  return { text: SAID[demoLanguage()] ?? SAID.en }
}

/** The demo student as their parent sees them. */
export function demoParentChildren(): { items: ParentChild[] } {
  const student = demo().demoStudent
  return {
    items: [
      { id: DEMO_STUDENT_ID, userId: DEMO_STUDENT_ID, name: student.name, email: student.email, grade: null, subjects: ['math'], relationship: 'parent' },
    ],
  }
}

export function demoChildSummary(childId: string): ChildLearningSummary | null {
  if (childId !== DEMO_STUDENT_ID) return null
  return {
    student: { id: DEMO_STUDENT_ID, name: demo().demoStudent.name, grade: null },
    questionsAskedThisWeek: 4,
    aiResolvedThisWeek: 3,
    teacherHelpRequestsThisWeek: 1,
    practiceLessonsCompletedThisWeek: 2,
    weakTopics: [],
    recentActivity: [],
    starAnswers: [],
  }
}

export function demoChildLearningProfile(childId: string): LearningProfile | null {
  if (childId !== DEMO_STUDENT_ID) return null
  return { studentId: DEMO_STUDENT_ID, subjects: [], subjectActivity: [], weakTopics: [], strengthTopics: [], updatedAt: new Date().toISOString() }
}

/**
 * The stand-in microphone: `getUserMedia` answers with a quiet tone from an
 * AudioContext (or refuses, `mic=denied`), so MediaRecorder records without a
 * device or a permission prompt. Left alone with `mic=real`.
 */
export function installPreviewMicrophone() {
  const mic = setting('mic')
  if (mic === 'real' || typeof navigator === 'undefined') return
  const devices = (navigator.mediaDevices ?? {}) as MediaDevices
  const getUserMedia = async (constraints?: MediaStreamConstraints): Promise<MediaStream> => {
    if (!constraints?.audio) throw new DOMException('The preview has no camera.', 'NotFoundError')
    if (mic === 'denied') throw new DOMException('Permission denied', 'NotAllowedError')
    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) throw new DOMException('No audio here.', 'NotFoundError')
    const context = new AudioContextClass()
    const tone = context.createOscillator()
    const gain = context.createGain()
    tone.frequency.value = 220
    gain.gain.value = 0.05
    const destination = context.createMediaStreamDestination()
    tone.connect(gain).connect(destination)
    tone.start()
    const stream = destination.stream
    // Stopping the track, as the recorder does when it is done, closes the tone too.
    for (const track of stream.getTracks()) {
      const stop = track.stop.bind(track)
      track.stop = () => {
        stop()
        tone.stop()
        void context.close()
      }
    }
    return stream
  }
  // On the prototype where there is one: WebKit does not keep a property set on
  // `navigator.mediaDevices` itself, so in Safari the real microphone was asked for (#726).
  const target = typeof MediaDevices === 'function' && navigator.mediaDevices instanceof MediaDevices ? MediaDevices.prototype : devices
  Object.defineProperty(target, 'getUserMedia', { value: getUserMedia, configurable: true, writable: true })
  if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { value: devices, configurable: true })
}
