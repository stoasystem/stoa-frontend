/*
 * Where the design preview's demo data comes from (#115): the demo data set
 * of #116 (`src/dev/demo/data`), in the language the preview is read in, and
 * the little state the demo backend keeps: which lessons of the demo
 * knowledge point are done, so finishing one moves the chapter on; when the
 * point was first lit (finishing its last lesson, as #9 point 3 triggers it
 * on the lesson-completion write); and whether the student has acknowledged
 * that lighting (stoa-backend#71's shape, #51).
 *
 * That state is the "server's": kept in this module, and mirrored to the
 * tab's own sessionStorage (`demoServerStorage`), so a reload of the same tab
 * finds the point still lit and already acknowledged - no replay - while a
 * new tab, a new browser context (each screenshot) or `?fresh=1` starts from
 * #116's opening state (`DEMO_COMPLETED_LESSONS`). The app itself stores
 * nothing about it.
 */
import {
  DEMO_COMPLETED_LESSONS,
  DEMO_KNOWLEDGE_POINT,
  demoDataFor,
  demoKnowledgePointState,
  demoLessons,
  demoRoadmap,
  type DemoData,
} from '@/dev/demo/data'
import { demoServerStorage } from '@/dev/preview/storage'
import type { LitEvent } from '@/features/starmap/lighting/lightingEvents'
import type { SupportedLanguage } from '@/i18n/languages'

let language: SupportedLanguage = 'en'
let data: DemoData = demoDataFor(language)
const SERVER_KEY = 'stoa.design-preview.v1.demo-server'

type ServerState = { completed: string[]; litAt: string | null; acknowledged: boolean }

function opening(): ServerState {
  return { completed: [...DEMO_COMPLETED_LESSONS], litAt: null, acknowledged: false }
}

function restore(): ServerState {
  try {
    const saved = JSON.parse(demoServerStorage()?.getItem(SERVER_KEY) ?? 'null') as ServerState | null
    if (saved && Array.isArray(saved.completed)) return { ...opening(), ...saved }
  } catch {
    // A broken record is no record.
  }
  return opening()
}

let server: ServerState = restore()
const completed = new Set<string>(server.completed)
const listeners = new Set<() => void>()
let version = 0

function changed() {
  server = { ...server, completed: [...completed] }
  try {
    demoServerStorage()?.setItem(SERVER_KEY, JSON.stringify(server))
  } catch {
    // Without the tab's storage, the state lasts until the reload.
  }
  version += 1
  for (const listener of listeners) listener()
}

/** Back to #116's opening state (`?fresh=1`). */
export function resetDemoServer() {
  server = opening()
  completed.clear()
  for (const id of server.completed) completed.add(id)
  changed()
}

/** Every lesson of the demo knowledge point done, its lighting not yet acknowledged (the `lighting` surface). */
export function finishDemoKnowledgePoint() {
  for (const lesson of DEMO_KNOWLEDGE_POINT.lessons) completed.add(lesson.lessonId)
  server = { ...server, litAt: server.litAt ?? new Date().toISOString(), acknowledged: false }
  changed()
}

/** Called when the demo backend's state changes. */
export function onDemoServerChange(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Grows by one with every change, for `useSyncExternalStore`. */
export function demoServerVersion(): number {
  return version
}

/** The lessons of the demo knowledge point done so far. */
export function completedLessons(): readonly string[] {
  return [...completed]
}

/** stoa-backend#71's unacknowledged lit points: the demo knowledge point, once lit and until acknowledged. */
export function unacknowledgedLit(): LitEvent[] {
  return server.litAt && !server.acknowledged
    ? [{ unitId: DEMO_KNOWLEDGE_POINT.unitId, litAt: server.litAt, litAtSource: 'observed' }]
    : []
}

export function acknowledgeLit(unitIds: readonly string[]) {
  if (!unitIds.includes(DEMO_KNOWLEDGE_POINT.unitId) || server.acknowledged) return
  server = { ...server, acknowledged: true }
  changed()
}

/** The language the backend would answer in: the page's, and later the student's choice on /me. */
export function setDemoLanguage(next: SupportedLanguage) {
  if (next === language) return
  language = next
  data = demoDataFor(next)
}

export function demoLanguage(): SupportedLanguage {
  return language
}

/** The demo data set in the current language. */
export function demo(): DemoData {
  return data
}

export function completeLesson(lessonId: string) {
  completed.add(lessonId)
  // First lit on the write that makes it so, and only then (#9 point 3).
  if (!server.litAt && demoKnowledgePointState([...completed]) === 'lit') server = { ...server, litAt: new Date().toISOString() }
  changed()
}

/** The roadmap and lessons of the demo knowledge point, with this page's completed lessons. */
export function demoChapterNow() {
  const done = [...completed]
  return { roadmap: demoRoadmap(done, language), lessons: demoLessons(language, done) }
}

export {
  checkDemoAnswer,
  DEMO_KNOWLEDGE_POINT,
  demoHint,
  demoLessonResult,
  demoTeacherAvailability,
  demoTeacherHelpRequests,
} from '@/dev/demo/data'
