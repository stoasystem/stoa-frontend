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
 *                          `limit` (429), `unsupported` (415), `silent`,
 *                          `tooLong`, `unreadable` (422), `notAllowed` (403)
 *   ?mic=denied            the browser refuses the microphone
 *   ?mic=real              the device's own microphone, not the stand-in
 *   ?role=parent           signed in as the demo parent: the demo student's
 *                          page, /parent/children/demo-student, holds the switch
 *
 * The microphone is a stand-in unless `mic=real`: a quiet tone made by the
 * page's own audio, so the browser's real MediaRecorder records real bytes
 * in its own format without asking for a microphone. The switch the parent
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

const ACCEPTED = new Set(['audio/webm', 'video/webm', 'audio/ogg', 'application/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'video/mp4'])
const FAILS: Record<string, [number, string]> = {
  limit: [429, 'voice_transcription_daily_limit'],
  unavailable: [503, 'voice_transcription_unavailable'],
  unsupported: [415, 'voice_recording_unsupported'],
  silent: [422, 'voice_recording_silent'],
  tooLong: [422, 'voice_recording_too_long'],
  unreadable: [422, 'voice_recording_unreadable'],
  notAllowed: [403, 'voice_questions_not_allowed'],
}
let failedOnce = false

/**
 * `POST /students/me/voice-questions/transcriptions`: the checks the backend
 * makes before the model (on, a type it takes, at most 2 MiB, not empty), a
 * moment's wait so "turning it into text" can be seen, then a fixed sentence.
 */
export async function demoTranscription(body: unknown): Promise<{ text: string } | [number, string]> {
  if (!voiceSwitchNow().allowed) return FAILS.notAllowed
  if (!(body instanceof Blob)) return FAILS.unsupported
  if (!ACCEPTED.has(body.type.split(';', 1)[0].trim().toLowerCase())) return FAILS.unsupported
  if (body.size > 2 * 1024 * 1024) return [413, 'voice_recording_too_large']
  if (body.size === 0) return FAILS.unreadable
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
  Object.defineProperty(devices, 'getUserMedia', { value: getUserMedia, configurable: true })
  if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { value: devices, configurable: true })
}
