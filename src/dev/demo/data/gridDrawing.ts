/*
 * Drawing on a coordinate grid in the design preview (#744): the three sample
 * exercises of stoa-backend#594 (`tests/fixtures/grid_drawing_samples_594.json`
 * there) -- plot points, draw a rectangle of area 12, draw the image of a
 * rotation -- as one demo lesson, `demo-grid-drawing`, outside the chapter's
 * own lessons so the chapter's counts stay as they are. The review shows the
 * rotation as one more card.
 *
 * The check is the backend's, as far as these samples go: what is not an
 * answer is refused as `practice_answer_invalid` (422), and a drawing is right
 * when it passes every check of its exercise, judged by what it is (any
 * rectangle of area 12, the image's corners in any order), never as drawn.
 * Every result carries the exercise's first solution as `standardDrawing`.
 */
import { DEMO_KNOWLEDGE_POINT, localize, type Localized } from '@/dev/demo/sky/demoSky'
import type { SupportedLanguage } from '@/i18n/languages'
import type {
  GridDrawing,
  GridPoint,
  GridSpec,
  PracticeAnswerResult,
  PracticeChallenge,
  PracticeLesson,
  PracticeLessonResult,
} from '@/types/practice'

const L = (en: string, de: string, fr: string, it: string): Localized => ({ en, de, fr, it })

export const DEMO_GRID_LESSON_ID = 'demo-grid-drawing'

/** `grid.limits` as the backend projects it: `MAX_POINTS`, `MAX_SEGMENTS`, `MAX_POLYGONS`. */
const LIMITS = { points: 26, segments: 30, polygons: 6 }

type Check =
  | { kind: 'point'; label: string; x: number; y: number }
  | { kind: 'count'; points?: number; polygons?: number }
  | { kind: 'rectangle'; area: number }
  | { kind: 'rotation'; of: string[]; center: [number, number]; angle: 90 | 180 | 270 }

type GridExercise = {
  prompt: Localized
  explanation: Localized
  grid: GridSpec
  checks: Check[]
  solution: GridDrawing
}

const at = (label: string, x: number, y: number): GridPoint => ({ label, x, y })

const EXERCISES: GridExercise[] = [
  {
    prompt: L(
      'Plot the points A(1|2), B(4|5) and C(7|1) in the coordinate system.',
      'Zeichne die Punkte A(1|2), B(4|5) und C(7|1) ins Koordinatensystem ein.',
      'Place les points A(1|2), B(4|5) et C(7|1) dans le repère.',
      'Disegna i punti A(1|2), B(4|5) e C(7|1) nel sistema di coordinate.',
    ),
    explanation: L(
      'First to the right (x), then up (y): A is 1 to the right and 2 up.',
      'Zuerst nach rechts (x), dann nach oben (y): A liegt 1 nach rechts und 2 nach oben.',
      'D’abord vers la droite (x), puis vers le haut (y) : A est 1 à droite et 2 en haut.',
      'Prima a destra (x), poi in alto (y): A è 1 a destra e 2 in alto.',
    ),
    grid: { xMin: 0, xMax: 8, yMin: 0, yMax: 6, step: 1, axes: true, axisLabels: true, labels: ['A', 'B', 'C'], given: { points: [], segments: [], polygons: [] }, limits: LIMITS },
    checks: [
      { kind: 'point', label: 'A', x: 1, y: 2 },
      { kind: 'point', label: 'B', x: 4, y: 5 },
      { kind: 'point', label: 'C', x: 7, y: 1 },
      { kind: 'count', points: 3 },
    ],
    solution: { points: [at('A', 1, 2), at('B', 4, 5), at('C', 7, 1)], segments: [], polygons: [] },
  },
  {
    prompt: L(
      'Draw a rectangle with an area of 12 squares.',
      'Zeichne ein Rechteck mit dem Flächeninhalt 12 Häuschen.',
      'Dessine un rectangle d’une aire de 12 carreaux.',
      'Disegna un rettangolo con un’area di 12 quadretti.',
    ),
    explanation: L(
      'Length times width must make 12, for example 3 · 4, 2 · 6 or 1 · 12.',
      'Länge mal Breite muss 12 ergeben, zum Beispiel 3 · 4, 2 · 6 oder 1 · 12.',
      'Longueur fois largeur doit donner 12, par exemple 3 · 4, 2 · 6 ou 1 · 12.',
      'Lunghezza per larghezza deve dare 12, per esempio 3 · 4, 2 · 6 o 1 · 12.',
    ),
    grid: { xMin: 0, xMax: 10, yMin: 0, yMax: 8, step: 1, axes: false, axisLabels: false, labels: [], given: { points: [], segments: [], polygons: [] }, limits: LIMITS },
    checks: [{ kind: 'rectangle', area: 12 }, { kind: 'count', polygons: 1 }],
    solution: {
      points: [at('P', 1, 1), at('Q', 5, 1), at('R', 5, 4), at('S', 1, 4)],
      segments: [],
      polygons: [['P', 'Q', 'R', 'S']],
    },
  },
  {
    prompt: L(
      "Rotate triangle ABC by 90° anticlockwise about the point Z. Draw the image triangle A'B'C'.",
      "Drehe das Dreieck ABC um 90° im Gegenuhrzeigersinn um den Punkt Z. Zeichne das Bilddreieck A'B'C'.",
      "Fais tourner le triangle ABC de 90° dans le sens inverse des aiguilles d’une montre autour du point Z. Dessine le triangle image A'B'C'.",
      "Ruota il triangolo ABC di 90° in senso antiorario attorno al punto Z. Disegna il triangolo immagine A'B'C'.",
    ),
    explanation: L(
      "Every point turns about Z: A(1|1) is 4 left of and 3 below Z, so A' is 3 right of and 4 below Z, which is A'(8|0).",
      "Jeder Punkt dreht sich um Z: A(1|1) liegt 4 links und 3 unter Z, A' liegt 3 rechts und 4 unter Z, also A'(8|0).",
      "Chaque point tourne autour de Z : A(1|1) est 4 à gauche et 3 sous Z, donc A' est 3 à droite et 4 sous Z, soit A'(8|0).",
      "Ogni punto ruota attorno a Z: A(1|1) è 4 a sinistra e 3 sotto Z, quindi A' è 3 a destra e 4 sotto Z, cioè A'(8|0).",
    ),
    grid: {
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 8,
      step: 1,
      axes: true,
      axisLabels: false,
      labels: ["A'", "B'", "C'"],
      given: { points: [at('A', 1, 1), at('B', 4, 1), at('C', 1, 3), at('Z', 5, 4)], segments: [], polygons: [['A', 'B', 'C']] },
      limits: LIMITS,
    },
    checks: [{ kind: 'rotation', of: ['A', 'B', 'C'], center: [5, 4], angle: 90 }, { kind: 'count', polygons: 1 }],
    solution: {
      points: [at("A'", 8, 0), at("B'", 8, 3), at("C'", 6, 0)],
      segments: [],
      polygons: [["A'", "B'", "C'"]],
    },
  },
]

const RIGHT = L('Right.', 'Richtig.', 'Juste.', 'Giusto.')
const NOT_YET = L(
  'Not yet. Look at the grid again.',
  'Noch nicht. Schau dir das Gitter noch einmal an.',
  'Pas encore. Regarde à nouveau le quadrillage.',
  'Non ancora. Guarda di nuovo la griglia.',
)

const challengeId = (index: number) => `${DEMO_GRID_LESSON_ID}-e${index + 1}`

function challengeOf(spec: GridExercise, index: number, language: SupportedLanguage): PracticeChallenge {
  const { unitId, subjectId, topicId, gradeLevel } = DEMO_KNOWLEDGE_POINT
  return {
    challengeId: challengeId(index),
    lessonId: DEMO_GRID_LESSON_ID,
    unitId,
    subjectId,
    gradeLevel,
    topicId,
    topic: localize(DEMO_KNOWLEDGE_POINT.name, language),
    type: 'grid_drawing',
    prompt: localize(spec.prompt, language),
    grid: spec.grid,
    hintAvailable: false,
    correctAnswer: '',
    explanation: localize(spec.explanation, language),
    correctFeedback: localize(RIGHT, language),
    incorrectFeedback: localize(NOT_YET, language),
  }
}

/** `GET /practice/lessons/demo-grid-drawing`. */
export function demoGridLesson(language: SupportedLanguage = 'en'): PracticeLesson {
  const { unitId, subjectId, topicId, gradeLevel } = DEMO_KNOWLEDGE_POINT
  return {
    id: DEMO_GRID_LESSON_ID,
    unitId,
    subjectId,
    gradeLevel,
    topicId,
    title: localize(L('Drawing on a grid', 'Zeichnen im Gitter', 'Dessiner dans un quadrillage', 'Disegnare nella griglia'), language),
    topic: localize(DEMO_KNOWLEDGE_POINT.name, language),
    difficulty: 'practice',
    status: 'available',
    estimatedMinutes: 8,
    challenges: EXERCISES.map((spec, index) => challengeOf(spec, index, language)),
  }
}

/** The rotation sample, as the review's grid card draws it. */
export function demoGridReviewChallenge(language: SupportedLanguage = 'en'): PracticeChallenge {
  return challengeOf(EXERCISES[2], 2, language)
}

/** `POST /practice/lessons/demo-grid-drawing/complete`; it lights nothing. */
export function demoGridLessonResult(correctCount?: number): PracticeLessonResult {
  const { subjectId, topicId, gradeLevel } = DEMO_KNOWLEDGE_POINT
  return {
    lessonId: DEMO_GRID_LESSON_ID,
    subjectId,
    gradeLevel,
    topicId,
    correctCount: correctCount ?? EXERCISES.length,
    totalCount: EXERCISES.length,
    progressPoints: 10 * EXERCISES.length,
    studyStreak: 5,
    timeSpentSeconds: 480,
    mistakes: [],
  }
}

const LABEL = /^[A-Za-z0-9'′]{1,3}$/

/** In halves, so every coordinate is a whole number and nothing is rounded. */
const halves = (value: number) => Math.round(value * 2)

/** The drawing as the backend reads one, or null where it is not an answer. */
function readDrawing(raw: unknown, grid: GridSpec): GridDrawing | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const drawing = raw as Partial<GridDrawing>
  const points = drawing.points ?? []
  const segments = drawing.segments ?? []
  const polygons = drawing.polygons ?? []
  if (!Array.isArray(points) || !Array.isArray(segments) || !Array.isArray(polygons)) return null
  if (points.length > LIMITS.points || segments.length > LIMITS.segments || polygons.length > LIMITS.polygons) return null
  if (points.length + segments.length + polygons.length === 0) return null
  const given = grid.given?.points ?? []
  const labels = new Set(given.map((point) => point.label))
  const places = new Set<string>()
  for (const point of points) {
    if (!point || typeof point.label !== 'string' || !LABEL.test(point.label) || labels.has(point.label)) return null
    if (typeof point.x !== 'number' || typeof point.y !== 'number') return null
    const onGrid =
      point.x >= grid.xMin && point.x <= grid.xMax && point.y >= grid.yMin && point.y <= grid.yMax &&
      Number.isInteger(point.x / grid.step) && Number.isInteger(point.y / grid.step)
    const place = `${point.x}|${point.y}`
    if (!onGrid || places.has(place)) return null
    labels.add(point.label)
    places.add(place)
  }
  const seen = new Set<string>()
  for (const segment of segments) {
    if (!Array.isArray(segment) || segment.length !== 2 || segment[0] === segment[1] || !segment.every((label) => labels.has(label))) return null
    const key = [...segment].sort().join('|')
    if (seen.has(key)) return null
    seen.add(key)
  }
  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || polygon.length < 3 || polygon.length > 12 || new Set(polygon).size !== polygon.length) return null
    if (!polygon.every((label) => labels.has(label))) return null
  }
  return { points, segments, polygons }
}

type Halves = [number, number]

function passes(check: Check, drawing: GridDrawing, grid: GridSpec): boolean {
  const where = new Map<string, Halves>(
    [...(grid.given?.points ?? []), ...drawing.points].map((point) => [point.label, [halves(point.x), halves(point.y)]]),
  )
  const cornersOf = (polygon: string[]) => polygon.map((label) => where.get(label)!)
  switch (check.kind) {
    case 'point': {
      const point = drawing.points.find((candidate) => candidate.label === check.label)
      return point !== undefined && halves(point.x) === halves(check.x) && halves(point.y) === halves(check.y)
    }
    case 'count':
      return (check.points === undefined || drawing.points.length === check.points) &&
        (check.polygons === undefined || drawing.polygons.length === check.polygons)
    case 'rectangle':
      return drawing.polygons.some((polygon) => {
        if (polygon.length !== 4) return false
        const corners = cornersOf(polygon)
        const sides = corners.map((corner, index) => {
          const next = corners[(index + 1) % 4]
          return [next[0] - corner[0], next[1] - corner[1]]
        })
        const square = sides.every((side, index) => {
          const next = sides[(index + 1) % 4]
          return side[0] * next[0] + side[1] * next[1] === 0
        })
        const twiceArea = Math.abs(corners.reduce((sum, corner, index) => {
          const next = corners[(index + 1) % 4]
          return sum + corner[0] * next[1] - next[0] * corner[1]
        }, 0))
        // Halves squared are quarters: twice the area in quarters is 8 times the area.
        return square && twiceArea > 0 && twiceArea === check.area * 8
      })
    case 'rotation': {
      const [cx, cy] = [halves(check.center[0]), halves(check.center[1])]
      const turn = ([x, y]: Halves): Halves => {
        const [dx, dy] = [x - cx, y - cy]
        const turned = check.angle === 90 ? [-dy, dx] : check.angle === 180 ? [-dx, -dy] : [dy, -dx]
        return [cx + turned[0], cy + turned[1]]
      }
      const image = new Set(check.of.map((label) => turn(where.get(label)!).join('|')))
      return drawing.polygons.some((polygon) => {
        const corners = new Set(cornersOf(polygon).map((corner) => corner.join('|')))
        return polygon.length === image.size && [...image].every((corner) => corners.has(corner))
      })
    }
  }
}

/**
 * `POST /practice/challenges/:id/answer` for a demo grid exercise: the result,
 * `'invalid'` where the backend would refuse the answer (422
 * `practice_answer_invalid`), or null for any other id.
 */
export function checkDemoGridAnswer(id: string, answer: unknown, language: SupportedLanguage = 'en'): PracticeAnswerResult | 'invalid' | null {
  const index = EXERCISES.findIndex((_, at) => challengeId(at) === id)
  if (index < 0) return null
  const spec = EXERCISES[index]
  const drawing = readDrawing(answer, spec.grid)
  if (!drawing) return 'invalid'
  const correct = spec.checks.every((check) => passes(check, drawing, spec.grid))
  return {
    challengeId: id,
    correct,
    feedback: localize(correct ? RIGHT : NOT_YET, language),
    ...(correct ? { explanation: localize(spec.explanation, language) } : {}),
    attemptsRemaining: correct ? 0 : 2,
    standardDrawing: spec.solution,
    canAskLearningAssistant: true,
    canAskTeacher: true,
  }
}
