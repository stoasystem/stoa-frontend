/*
 * The screens the design preview opens (#115, map #114's scope), each as the
 * real route it ships under. `preview.html?surface=<id>` opens one; the
 * comparison page lists them.
 */
import { DEMO_HELP_CONVERSATION_ID, DEMO_KNOWLEDGE_POINT, type FixtureSize } from '@/dev/demo/data'

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
  /** Why the surface cannot be shown yet, if it cannot. */
  pending?: string
}

const { subjectId, topicId, unitId } = DEMO_KNOWLEDGE_POINT
const [firstLesson] = DEMO_KNOWLEDGE_POINT.lessons
/** The lesson the chapter goes on with: the first one not done when the preview opens. */
const nextLesson = DEMO_KNOWLEDGE_POINT.lessons[DEMO_KNOWLEDGE_POINT.lessonsDone] ?? firstLesson

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
  { id: 'chapter', label: 'Chapter', path: () => `/chapter/${unitId}`, signedIn: true, stars: false },
  { id: 'lesson', label: 'Practice stage', path: () => `/chapter/${unitId}/${nextLesson.lessonId}`, signedIn: true, stars: false },
  { id: 'ask', label: 'Ask · new question', path: (points) => withPoints('/ask', points), signedIn: true, stars: true },
  { id: 'ask-conversation', label: 'Ask · conversation', path: (points) => withPoints(`/ask/${DEMO_HELP_CONVERSATION_ID}`, points), signedIn: true, stars: true },
  { id: 'me', label: '/me', path: () => '/me', signedIn: true, stars: false },
  { id: 'account-menu', label: 'Account menu', path: () => '/me', signedIn: true, stars: false, open: 'account-menu' },
  {
    id: 'lighting',
    label: 'Lighting moment',
    path: (points) => withPoints(`/map/${subjectId}`, points),
    signedIn: true,
    stars: true,
    pending: 'Not built yet: the lighting moment has no implementation to show.',
  },
]

export function surfaceById(id: string | null): Surface | undefined {
  return SURFACES.find((surface) => surface.id === id)
}

export function starCountFrom(value: string | null): StarCount {
  const asked = Number(value)
  return (STAR_COUNTS as readonly number[]).includes(asked) ? (asked as StarCount) : DEFAULT_STAR_COUNT
}
