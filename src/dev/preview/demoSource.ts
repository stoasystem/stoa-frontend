/*
 * Where the design preview's demo data comes from (#115): the demo data set
 * of #116 (`src/dev/demo/data`), in the language the preview is read in, and
 * the little state the preview keeps while a page is open - which lessons of
 * the demo knowledge point are done, so finishing one moves the chapter on.
 *
 * Nothing is kept across a reload: every load starts from #116's opening
 * state (`DEMO_COMPLETED_LESSONS`).
 */
import {
  DEMO_COMPLETED_LESSONS,
  demoDataFor,
  demoLessons,
  demoRoadmap,
  type DemoData,
} from '@/dev/demo/data'
import type { SupportedLanguage } from '@/i18n/languages'

let language: SupportedLanguage = 'en'
let data: DemoData = demoDataFor(language)
const completed = new Set<string>(DEMO_COMPLETED_LESSONS)

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
