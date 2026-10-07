/*
 * The design preview's demo data set (#116, map #114). Local development
 * only: nothing outside `src/dev` imports this, and it never reaches the
 * production bundle. The star map's demo sky lives beside it in
 * `src/dev/demo/sky` (#131) and reaches the map only through the star map
 * source seam (`starMapSource.ts`); this module re-exports it.
 *
 * Stable contract (the preview, #115, reads these names; keep them):
 *
 *   demoStudent        User              the signed-in demo student (`GET /auth/me`)
 *   demoProfile        StudentProfile    their profile on /me (`GET /students/me/profile`)
 *   demoNotifications  NotificationListResponse   the bell (`GET /notifications`)
 *   demoConversations  Conversation[]    Ask's conversations, with their messages
 *   demoChapter        DemoChapter       the demo knowledge point's chapter: the catalog,
 *                                        the topic roadmap and the lessons with exercises
 *   demoSky / demoStarMap / DEMO_KNOWLEDGE_POINT / FIXTURE_SIZES   the star map's demo
 *
 * The named objects are in English. `demoDataFor(language)` gives the same set
 * in de / en / fr / it, the way the backend sends content already in the
 * reader's language. Behind the chapter, the answers the backend would give:
 * `checkDemoAnswer`, `demoHint`, `demoLessonResult`, `demoRoadmap(completed)`
 * and `demoKnowledgePointState(completed)`; behind Ask, the teacher-help
 * status (`demoTeacherHelpRequests`) and availability.
 *
 * Vocabulary (CONTEXT.md): the demo knowledge point (演示知识点) is the one
 * star with a chapter; every other star is a placeholder star (占位星), with
 * a name and a learning state and no content; star dust (星尘) is decoration
 * and is not data at all.
 */
import { demoChapterFor, type DemoChapter } from '@/dev/demo/data/chapter'
import { demoConversationListFor, demoConversationsFor } from '@/dev/demo/data/conversations'
import { demoNotificationsFor } from '@/dev/demo/data/notifications'
import { demoProfileFor, demoStudentFor } from '@/dev/demo/data/student'
import { demoSky, type DemoSky } from '@/dev/demo/sky/demoSky'
import type { SupportedLanguage } from '@/i18n/languages'
import type { Conversation, ConversationListResponse } from '@/types/chat'
import type { NotificationListResponse } from '@/types/notification'
import type { StudentProfile } from '@/types/student'
import type { User } from '@/types/user'

export type DemoData = {
  demoStudent: User
  demoProfile: StudentProfile
  demoNotifications: NotificationListResponse
  demoConversations: Conversation[]
  demoConversationList: ConversationListResponse
  demoChapter: DemoChapter
  /** The default sky, 1000 stars. */
  demoSky: DemoSky
}

export function demoDataFor(language: SupportedLanguage): DemoData {
  return {
    demoStudent: demoStudentFor(language),
    demoProfile: demoProfileFor(language),
    demoNotifications: demoNotificationsFor(language),
    demoConversations: demoConversationsFor(language),
    demoConversationList: demoConversationListFor(language),
    demoChapter: demoChapterFor(language),
    demoSky: demoSky(1000, language),
  }
}

export const demoStudent: User = demoStudentFor('en')
export const demoProfile: StudentProfile = demoProfileFor('en')
export const demoNotifications: NotificationListResponse = demoNotificationsFor('en')
export const demoConversations: Conversation[] = demoConversationsFor('en')
export const demoConversationList: ConversationListResponse = demoConversationListFor('en')
export const demoChapter: DemoChapter = demoChapterFor('en')

export {
  checkDemoAnswer,
  DEMO_COMPLETED_LESSONS,
  demoCatalog,
  demoHint,
  demoKnowledgePointState,
  demoLessonResult,
  demoLessons,
  demoRoadmap,
  type DemoChapter,
} from '@/dev/demo/data/chapter'
export {
  DEMO_HELP_CONVERSATION_ID,
  DEMO_TEACHER_NAME,
  demoTeacherAvailability,
  demoTeacherHelpRequests,
} from '@/dev/demo/data/conversations'
export { DEMO_STUDENT_ID } from '@/dev/demo/data/student'
export {
  DEMO_BRIDGE_STAR,
  DEMO_KNOWLEDGE_POINT,
  demoSky,
  demoStarKind,
  localize,
  type DemoSky,
  type DemoStarKind,
  type Localized,
} from '@/dev/demo/sky/demoSky'
export { demoStarMap, type DemoStarMapOptions } from '@/dev/demo/sky/demoStarMap'
export { FIXTURE_SIZES, type FixtureSize } from '@/dev/demo/sky/demoSky'
