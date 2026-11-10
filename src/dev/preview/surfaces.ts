/*
 * The screens the design preview opens (#115, map #114's scope), each as the
 * real route it ships under. `preview.html?surface=<id>` opens one; the
 * comparison page lists them.
 */
import {
  DEMO_BRIDGE_STAR,
  DEMO_FIND_STAR_CONVERSATION_ID,
  DEMO_HELP_CONVERSATION_ID,
  DEMO_KNOWLEDGE_POINT,
  DEMO_SECTIONS_CONVERSATION_ID,
  type FixtureSize,
} from '@/dev/demo/data'

export const STAR_COUNTS = [10, 1000, 2000] as const satisfies readonly FixtureSize[]
export type StarCount = (typeof STAR_COUNTS)[number]
export const DEFAULT_STAR_COUNT: StarCount = 1000

export type Surface = {
  id: string
  label: string
  /** The route to open, for a star map of `points` stars. */
  path: (points: StarCount) => string
  /** False for the screens a signed-out visitor sees. */
  signedIn: boolean
  /** Whether the star map is on screen, so the star count changes what it shows. */
  stars: boolean
  /** Something to do once the page is up, to show a state behind a click. */
  open?: 'account-menu'
  /**
   * An element to give keyboard focus once the page is up (#121): a nebula's
   * link on the panorama, or a star's link in a nebula, to show what focus
   * lights up.
   */
  focus?: string
  /** The demo backend's state to start from, when it is not #116's opening state. */
  demo?: 'demo-point-finished' | 'review-due' | 'review-scheduled' | 'newcomer'
  /**
   * `later`: "About you" (#591) already put off in this tab, for a newcomer's
   * surface that shows what comes after it.
   */
  aboutYou?: 'later'
  /** An account that never stored a language: the language first (#627) asks it before "About you". */
  languageFirst?: true
  /** What must be on the page before it counts as ready, for the screenshot. */
  readyWhen?: string
  /** Why the surface cannot be shown yet, if it cannot. */
  pending?: string
}

const { subjectId, topicId, unitId } = DEMO_KNOWLEDGE_POINT
const [firstLesson] = DEMO_KNOWLEDGE_POINT.lessons
/** The lesson the chapter goes on with: the first one not done when the preview opens. */
const nextLesson = DEMO_KNOWLEDGE_POINT.lessons[DEMO_KNOWLEDGE_POINT.lessonsDone] ?? firstLesson
/** The small star with more than one stage, and the extension one (#501). */
const coreStages = DEMO_KNOWLEDGE_POINT.skills.find(
  (skill) => DEMO_KNOWLEDGE_POINT.lessons.filter((lesson) => lesson.skillId === skill.skillId).length > 1,
)!
const extension = DEMO_KNOWLEDGE_POINT.skills.find((skill) => skill.extension)!
/** `skillPath` of the chapter, spelled out: no application module loads before the preview's interception. */
const skillPath = (unit: string, skillId: string) => `/chapter/${unit}?skill=${encodeURIComponent(skillId)}`

/** The physics nebula of `DEMO_BRIDGE_STAR` (`demo-sky.json`'s `bridge.topicId`). */
const DEMO_BRIDGE_TOPIC = 'optics'

const withPoints = (path: string, points: StarCount) => `${path}?points=${points}`

export const SURFACES: readonly Surface[] = [
  { id: 'login', label: 'Login', path: () => '/login', signedIn: false, stars: false },
  { id: 'map', label: 'Star map · panorama', path: (points) => withPoints(`/map/${subjectId}`, points), signedIn: true, stars: true },
  {
    id: 'map-nebula',
    label: 'Star map · nebula',
    path: (points) => withPoints(`/map/${subjectId}/${topicId}`, points),
    signedIn: true,
    stars: true,
  },
  {
    id: 'map-star',
    label: 'Star map · demo knowledge point',
    path: (points) => withPoints(`/map/${subjectId}/${topicId}/${unitId}`, points),
    signedIn: true,
    stars: true,
  },
  // The connection lines (#121): what lights up when a nebula or a star is in
  // focus, and the cross-subject prerequisite (physics optics needs
  // mathematics trigonometry; Refraction waits for the demo knowledge point).
  {
    id: 'map-focus-optics',
    label: 'Star map · panorama, optics in focus',
    path: (points) => withPoints('/map/physics', points),
    signedIn: true,
    stars: true,
    focus: '[data-nebula-link="optics"]',
  },
  {
    id: 'map-focus-star',
    label: 'Star map · nebula, a star in focus',
    path: (points) => withPoints(`/map/${subjectId}/${topicId}`, points),
    signedIn: true,
    stars: true,
    focus: `[data-unit="${unitId}"]`,
  },
  {
    id: 'map-optics',
    label: 'Star map · optics nebula (cross-subject)',
    path: (points) => withPoints(`/map/physics/${DEMO_BRIDGE_TOPIC}`, points),
    signedIn: true,
    stars: true,
  },
  {
    id: 'map-refraction',
    label: 'Star map · Refraction (waiting on a prerequisite, cross-subject)',
    path: (points) => withPoints(`/map/physics/${DEMO_BRIDGE_TOPIC}/${DEMO_BRIDGE_STAR}`, points),
    signedIn: true,
    stars: true,
  },
  // #627: before "About you", a newcomer whose account never stored a language picks one.
  {
    id: 'language-first',
    label: 'Star map · newcomer, language first',
    path: (points) => withPoints('/', points),
    signedIn: true,
    stars: true,
    demo: 'newcomer',
    languageFirst: true,
    readyWhen: '[data-language-first] [data-shown]',
  },
  // #591: before the first landing, a newcomer with no year group on the profile is asked it
  // and the subjects school is on. A lower-secondary year lands on the demo knowledge point.
  {
    id: 'about-you',
    label: 'Star map · newcomer, About you',
    path: (points) => withPoints('/', points),
    signedIn: true,
    stars: true,
    demo: 'newcomer',
    readyWhen: '[data-about-you] [data-shown]',
  },
  // The first landing (plan A): a student who has not started anything opens the app on
  // the recommended star's nebula, Murmi beside the star, instead of the whole sky.
  // "About you" put off, so it lands where the course starts.
  {
    id: 'map-newcomer',
    label: 'Star map · newcomer, first landing',
    path: (points) => withPoints('/', points),
    signedIn: true,
    stars: true,
    demo: 'newcomer',
    aboutYou: 'later',
    readyWhen: '[data-first-landing] [data-shown]',
  },
  // The whole first sign-in (docs/research/user-onboarding-design.md): the invitation link,
  // signing in, which subject school is on, and the first landing on "Integers", where the
  // course starts. That star has no chapter in the preview; "Find my own star" (#586) goes on:
  // the example about sine and cosine finds the demo knowledge point, whose path and chapter
  // lead to the practice stage. That question counts as asking, so the practice stage's
  // first-time tip is not shown on this walk; `lesson-first` shows it.
  {
    id: 'onboarding',
    label: 'First sign-in · the whole onboarding',
    path: () => '/activate?token=demo-invitation',
    signedIn: false,
    stars: false,
    demo: 'newcomer',
  },
  // #593: the review reminder -- Murmi whistling in the map's corner with reviews due, asleep
  // with reviews scheduled and none due yet.
  {
    id: 'map-review-due',
    label: 'Star map · review reminder, reviews due',
    path: (points) => withPoints(`/map/${subjectId}`, points),
    signedIn: true,
    stars: true,
    demo: 'review-due',
    readyWhen: '[data-review-reminder="calling"]',
  },
  {
    id: 'map-review-scheduled',
    label: 'Star map · review reminder, none due yet',
    path: (points) => withPoints(`/map/${subjectId}`, points),
    signedIn: true,
    stars: true,
    demo: 'review-scheduled',
    readyWhen: '[data-review-reminder="sleeping"]',
  },
  { id: 'chapter', label: 'Chapter', path: () => `/chapter/${unitId}`, signedIn: true, stars: false },
  { id: 'lesson', label: 'Practice stage', path: () => `/chapter/${unitId}/${nextLesson.lessonId}`, signedIn: true, stars: false },
  // #586: a student new to Ask on the practice stage for the first time: Murmi points at Ask.
  {
    id: 'lesson-first',
    label: 'Practice stage · first time, new to Ask',
    path: () => `/chapter/${unitId}/${firstLesson.lessonId}`,
    signedIn: true,
    stars: false,
    demo: 'newcomer',
    readyWhen: '[data-stage-ask-tip]',
  },
  // #501: a small star's own page -- a core one in two stages, and the
  // extension one with what it asks to be learned first.
  { id: 'skill', label: 'Small star · stages', path: () => skillPath(unitId, coreStages.skillId), signedIn: true, stars: false },
  { id: 'skill-extension', label: 'Small star · extension', path: () => skillPath(unitId, extension.skillId), signedIn: true, stars: false },
  // #181: the review page with questions due, one of each way of answering.
  { id: 'review', label: 'Review', path: () => `/review/${unitId}`, signedIn: true, stars: false, demo: 'review-due', readyWhen: 'main form, main [role="radiogroup"], main textarea, main input' },
  { id: 'ask', label: 'Ask · new question', path: (points) => withPoints('/ask', points), signedIn: true, stars: true },
  { id: 'ask-conversation', label: 'Ask · conversation', path: (points) => withPoints(`/ask/${DEMO_HELP_CONVERSATION_ID}`, points), signedIn: true, stars: true },
  // #487: an answer that found a star, read back with the conversation; its card flies to it.
  { id: 'ask-find-star', label: 'Ask · find a star', path: (points) => withPoints(`/ask/${DEMO_FIND_STAR_CONVERSATION_ID}`, points), signedIn: true, stars: true },
  { id: 'ask-sections', label: 'Ask · answer in sections', path: (points) => withPoints(`/ask/${DEMO_SECTIONS_CONVERSATION_ID}`, points), signedIn: true, stars: true },
  { id: 'me', label: '/me', path: () => '/me', signedIn: true, stars: false },
  { id: 'account-menu', label: 'Account menu', path: () => '/me', signedIn: true, stars: false, open: 'account-menu' },
  {
    // The chapter's way back to the map, right after its last lesson: the
    // flare plays once on the star; the screenshot is taken once it is over.
    id: 'lighting',
    label: 'Lighting moment',
    path: (points) => withPoints(`/map/${subjectId}/${topicId}/${unitId}`, points),
    signedIn: true,
    stars: true,
    demo: 'demo-point-finished',
    readyWhen: '[data-lighting="done"]',
  },
]

export function surfaceById(id: string | null): Surface | undefined {
  return SURFACES.find((surface) => surface.id === id)
}

export function starCountFrom(value: string | null): StarCount {
  const asked = Number(value)
  return (STAR_COUNTS as readonly number[]).includes(asked) ? (asked as StarCount) : DEFAULT_STAR_COUNT
}
