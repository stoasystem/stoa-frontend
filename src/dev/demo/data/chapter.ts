/*
 * The demo knowledge point's chapter (#116): three lessons, ten exercises,
 * enough to walk a wrong answer, a right one, a finished lesson and a lit
 * star. In the shapes the chapter and the practice stage read
 * (`useChapter`, `useLessonQuery`, `useLessonRun`): the curriculum catalog,
 * the topic roadmap, the lessons with their exercises, and the answers the
 * backend's check, hint and completion would give.
 *
 * Ids, lesson titles and how many lessons are done when the preview opens
 * come from the star map's demo sky (`DEMO_KNOWLEDGE_POINT`), so the star and
 * its chapter cannot disagree.
 */
import { DEMO_KNOWLEDGE_POINT, demoSky, localize, type Localized } from '@/dev/demo/sky/demoSky'
import type { LearningState } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'
import type {
  CurriculumCatalog,
  PracticeAnswerResult,
  PracticeChallenge,
  PracticeChallengeType,
  PracticeHintResponse,
  PracticeLesson,
  PracticeLessonResult,
  PracticeRoadmap,
} from '@/types/practice'

const L = (en: string, de: string, fr: string, it: string): Localized => ({ en, de, fr, it })
const all = (text: string): Localized => L(text, text, text, text)

type ExerciseSpec = {
  type: PracticeChallengeType
  prompt: Localized
  /** Multiple choice and ordering: the choices, as shown. */
  options?: Localized[]
  /** The option index (multiple choice), the order of option indexes (ordering), or the text. */
  answer: number | number[] | Localized
  /** Other spellings of a text answer that count as right. */
  accepted?: string[]
  hint: Localized
  explanation: Localized
}

const SIDES = [
  L('The hypotenuse', 'Die Hypotenuse', "L'hypoténuse", "L'ipotenusa"),
  L('The opposite side', 'Die Gegenkathete', 'Le côté opposé', 'Il cateto opposto'),
  L('The adjacent side', 'Die Ankathete', 'Le côté adjacent', 'Il cateto adiacente'),
]

const RATIOS = [
  L('opposite ÷ hypotenuse', 'Gegenkathete ÷ Hypotenuse', 'opposé ÷ hypoténuse', 'opposto ÷ ipotenusa'),
  L('adjacent ÷ hypotenuse', 'Ankathete ÷ Hypotenuse', 'adjacent ÷ hypoténuse', 'adiacente ÷ ipotenusa'),
  L('opposite ÷ adjacent', 'Gegenkathete ÷ Ankathete', 'opposé ÷ adjacent', 'opposto ÷ adiacente'),
]

const PYTHAGORAS = L('Use $a^2 + b^2 = c^2$.', 'Nutze $a^2 + b^2 = c^2$.', 'Utilise $a^2 + b^2 = c^2$.', 'Usa $a^2 + b^2 = c^2$.')
const SOHCAHTOA = L(
  'Sine: the side facing the angle, over the hypotenuse.',
  'Sinus: die Seite gegenüber dem Winkel, geteilt durch die Hypotenuse.',
  "Sinus : le côté en face de l'angle, divisé par l'hypoténuse.",
  "Seno: il lato di fronte all'angolo, diviso per l'ipotenusa.",
)
const COSINE = L(
  'Cosine: the side at the angle, over the hypotenuse.',
  "Kosinus: die Seite am Winkel, geteilt durch die Hypotenuse.",
  "Cosinus : le côté qui touche l'angle, divisé par l'hypoténuse.",
  "Coseno: il lato che tocca l'angolo, diviso per l'ipotenusa.",
)

/** Exercises per lesson, in the lessons' order. */
const EXERCISES: ExerciseSpec[][] = [
  [
    {
      type: 'multiple_choice',
      prompt: L(
        'In a right triangle, which side lies opposite the right angle?',
        'Welche Seite liegt im rechtwinkligen Dreieck dem rechten Winkel gegenüber?',
        "Dans un triangle rectangle, quel côté est opposé à l'angle droit ?",
        "In un triangolo rettangolo, quale lato è opposto all'angolo retto?",
      ),
      options: SIDES,
      answer: 0,
      hint: L('It is the longest side.', 'Es ist die längste Seite.', "C'est le côté le plus long.", 'È il lato più lungo.'),
      explanation: L(
        'The hypotenuse faces the right angle and is always the longest side.',
        'Die Hypotenuse liegt dem rechten Winkel gegenüber und ist immer die längste Seite.',
        "L'hypoténuse fait face à l'angle droit ; c'est toujours le côté le plus long.",
        "L'ipotenusa è opposta all'angolo retto ed è sempre il lato più lungo.",
      ),
    },
    {
      type: 'multiple_choice',
      prompt: L(
        'Which side touches the angle $\\alpha$ but is not the hypotenuse?',
        'Welche Seite liegt am Winkel $\\alpha$ an, ist aber nicht die Hypotenuse?',
        "Quel côté touche l'angle $\\alpha$ sans être l'hypoténuse ?",
        "Quale lato tocca l'angolo $\\alpha$ ma non è l'ipotenusa?",
      ),
      options: SIDES,
      answer: 2,
      hint: L('It lies next to the angle.', 'Sie liegt neben dem Winkel.', "Il est à côté de l'angle.", "Sta accanto all'angolo."),
      explanation: L(
        'The adjacent side and the hypotenuse meet at $\\alpha$.',
        'Ankathete und Hypotenuse treffen sich im Winkel $\\alpha$.',
        "Le côté adjacent et l'hypoténuse se rejoignent en $\\alpha$.",
        "Il cateto adiacente e l'ipotenusa si incontrano in $\\alpha$.",
      ),
    },
    {
      type: 'text_input',
      prompt: L(
        'The hypotenuse is 10 cm and one leg is 6 cm. How long is the other leg, in cm?',
        'Die Hypotenuse ist 10 cm, eine Kathete 6 cm lang. Wie lang ist die andere Kathete in cm?',
        "L'hypoténuse mesure 10 cm et un côté de l'angle droit 6 cm. Combien mesure l'autre, en cm ?",
        "L'ipotenusa misura 10 cm e un cateto 6 cm. Quanto misura l'altro cateto, in cm?",
      ),
      answer: all('8'),
      accepted: ['8 cm'],
      hint: PYTHAGORAS,
      explanation: all('$\\sqrt{10^2 - 6^2} = \\sqrt{64} = 8$'),
    },
  ],
  [
    {
      type: 'multiple_choice',
      prompt: L(
        'What is $\\sin\\alpha$ in a right triangle?',
        'Was ist $\\sin\\alpha$ im rechtwinkligen Dreieck?',
        'Que vaut $\\sin\\alpha$ dans un triangle rectangle ?',
        'Quanto vale $\\sin\\alpha$ in un triangolo rettangolo?',
      ),
      options: RATIOS,
      answer: 0,
      hint: SOHCAHTOA,
      explanation: SOHCAHTOA,
    },
    {
      type: 'multiple_choice',
      prompt: L('What is $\\cos\\alpha$?', 'Was ist $\\cos\\alpha$?', 'Que vaut $\\cos\\alpha$ ?', 'Quanto vale $\\cos\\alpha$?'),
      options: RATIOS,
      answer: 1,
      hint: COSINE,
      explanation: COSINE,
    },
    {
      type: 'text_input',
      prompt: L(
        'The opposite side is 3 and the hypotenuse is 5. What is $\\sin\\alpha$, as a decimal?',
        'Die Gegenkathete ist 3, die Hypotenuse 5. Wie gross ist $\\sin\\alpha$ als Dezimalzahl?',
        "Le côté opposé mesure 3 et l'hypoténuse 5. Que vaut $\\sin\\alpha$, en nombre décimal ?",
        "Il cateto opposto misura 3 e l'ipotenusa 5. Quanto vale $\\sin\\alpha$, come numero decimale?",
      ),
      answer: L('0.6', '0,6', '0,6', '0,6'),
      accepted: ['0.6', '0,6', '3/5', '.6'],
      hint: SOHCAHTOA,
      explanation: L('$3 \\div 5 = 0.6$', '$3 : 5 = 0{,}6$', '$3 \\div 5 = 0{,}6$', '$3 : 5 = 0{,}6$'),
    },
    {
      type: 'ordering',
      prompt: L('Order from smallest to largest.', 'Ordne vom kleinsten zum grössten Wert.', 'Range du plus petit au plus grand.', 'Ordina dal più piccolo al più grande.'),
      options: [all('$\\sin 90^\\circ$'), all('$\\sin 30^\\circ$'), all('$\\sin 60^\\circ$')],
      answer: [1, 2, 0],
      hint: L(
        'The sine grows from 0° to 90°.',
        'Der Sinus wächst von 0° bis 90°.',
        'Le sinus croît de 0° à 90°.',
        'Il seno cresce da 0° a 90°.',
      ),
      explanation: all('$0.5 < 0.87 < 1$'),
    },
  ],
  [
    {
      type: 'text_input',
      prompt: L(
        'The hypotenuse is 12 and $\\alpha = 30^\\circ$. How long is the opposite side?',
        'Die Hypotenuse ist 12 und $\\alpha = 30^\\circ$. Wie lang ist die Gegenkathete?',
        "L'hypoténuse mesure 12 et $\\alpha = 30^\\circ$. Combien mesure le côté opposé ?",
        "L'ipotenusa misura 12 e $\\alpha = 30^\\circ$. Quanto misura il cateto opposto?",
      ),
      answer: all('6'),
      hint: L(
        'Opposite = hypotenuse × $\\sin\\alpha$.',
        'Gegenkathete = Hypotenuse × $\\sin\\alpha$.',
        'Opposé = hypoténuse × $\\sin\\alpha$.',
        'Opposto = ipotenusa × $\\sin\\alpha$.',
      ),
      explanation: all('$12 \\cdot \\sin 30^\\circ = 12 \\cdot \\tfrac{1}{2} = 6$'),
    },
    {
      type: 'multiple_choice',
      prompt: L(
        'The adjacent side is 4 and $\\cos\\alpha = 0.8$. How long is the hypotenuse?',
        'Die Ankathete ist 4 und $\\cos\\alpha = 0{,}8$. Wie lang ist die Hypotenuse?',
        "Le côté adjacent mesure 4 et $\\cos\\alpha = 0{,}8$. Combien mesure l'hypoténuse ?",
        "Il cateto adiacente misura 4 e $\\cos\\alpha = 0{,}8$. Quanto misura l'ipotenusa?",
      ),
      options: [L('3.2', '3,2', '3,2', '3,2'), all('5'), L('4.8', '4,8', '4,8', '4,8')],
      answer: 1,
      hint: L(
        'Hypotenuse = adjacent ÷ $\\cos\\alpha$.',
        'Hypotenuse = Ankathete ÷ $\\cos\\alpha$.',
        'Hypoténuse = adjacent ÷ $\\cos\\alpha$.',
        'Ipotenusa = adiacente ÷ $\\cos\\alpha$.',
      ),
      explanation: L('$4 \\div 0.8 = 5$', '$4 : 0{,}8 = 5$', '$4 \\div 0{,}8 = 5$', '$4 : 0{,}8 = 5$'),
    },
    {
      type: 'text_input',
      prompt: L(
        'The hypotenuse is 20 and $\\cos\\alpha = 0.5$. How long is the adjacent side?',
        'Die Hypotenuse ist 20 und $\\cos\\alpha = 0{,}5$. Wie lang ist die Ankathete?',
        "L'hypoténuse mesure 20 et $\\cos\\alpha = 0{,}5$. Combien mesure le côté adjacent ?",
        "L'ipotenusa misura 20 e $\\cos\\alpha = 0{,}5$. Quanto misura il cateto adiacente?",
      ),
      answer: all('10'),
      hint: COSINE,
      explanation: L('$20 \\cdot 0.5 = 10$', '$20 \\cdot 0{,}5 = 10$', '$20 \\cdot 0{,}5 = 10$', '$20 \\cdot 0{,}5 = 10$'),
    },
  ],
]

const RIGHT = L('Right.', 'Richtig.', 'Juste.', 'Giusto.')
const NOT_YET = L(
  'Not yet. Look at the triangle again.',
  'Noch nicht. Schau dir das Dreieck noch einmal an.',
  'Pas encore. Regarde à nouveau le triangle.',
  'Non ancora. Guarda di nuovo il triangolo.',
)
const HINT_TITLE = L('Hint', 'Tipp', 'Indice', 'Suggerimento')

const { unitId, subjectId, topicId, gradeLevel } = DEMO_KNOWLEDGE_POINT
const ESTIMATED_MINUTES = 10

const challengeId = (lesson: number, exercise: number) => `${DEMO_KNOWLEDGE_POINT.lessons[lesson].lessonId}-e${exercise + 1}`

function challengeOf(spec: ExerciseSpec, lesson: number, exercise: number, language: SupportedLanguage): PracticeChallenge {
  const options = spec.options?.map((option) => localize(option, language))
  const correctAnswer =
    typeof spec.answer === 'number'
      ? options![spec.answer]
      : Array.isArray(spec.answer)
        ? spec.answer.map((index) => options![index])
        : localize(spec.answer, language)
  return {
    id: challengeId(lesson, exercise),
    lessonId: DEMO_KNOWLEDGE_POINT.lessons[lesson].lessonId,
    unitId,
    subjectId,
    gradeLevel,
    topicId,
    topic: localize(DEMO_KNOWLEDGE_POINT.name, language),
    type: spec.type,
    prompt: localize(spec.prompt, language),
    ...(options ? { options } : {}),
    correctAnswer,
    hint: localize(spec.hint, language),
    explanation: localize(spec.explanation, language),
    correctFeedback: localize(RIGHT, language),
    incorrectFeedback: localize(NOT_YET, language),
  }
}

/** Lesson ids done when the preview opens. */
export const DEMO_COMPLETED_LESSONS: readonly string[] = DEMO_KNOWLEDGE_POINT.lessons
  .slice(0, DEMO_KNOWLEDGE_POINT.lessonsDone)
  .map((lesson) => lesson.lessonId)

export function demoLessons(language: SupportedLanguage = 'en', completed: readonly string[] = DEMO_COMPLETED_LESSONS): PracticeLesson[] {
  return DEMO_KNOWLEDGE_POINT.lessons.map((lesson, index) => ({
    id: lesson.lessonId,
    unitId,
    subjectId,
    gradeLevel,
    topicId,
    title: localize(lesson.title, language),
    topic: localize(DEMO_KNOWLEDGE_POINT.name, language),
    difficulty: index === 0 ? 'intro' : 'practice',
    status: completed.includes(lesson.lessonId) ? 'completed' : 'available',
    estimatedMinutes: ESTIMATED_MINUTES,
    challenges: EXERCISES[index].map((spec, exercise) => challengeOf(spec, index, exercise, language)),
  }))
}

const topicName = (language: SupportedLanguage) =>
  demoSky(10, language).nebulae.find((nebula) => nebula.topicId === topicId)?.name ?? topicId
const subjectName = (language: SupportedLanguage) =>
  demoSky(10, language).galaxies.find((galaxy) => galaxy.subjectId === subjectId)?.name ?? subjectId

/** `GET /practice/curriculum/catalog`, as far as the demo knowledge point goes. */
export function demoCatalog(language: SupportedLanguage = 'en'): CurriculumCatalog {
  return {
    subjects: [
      {
        id: subjectId,
        name: subjectName(language),
        description: '',
        gradeLevels: [{ id: gradeLevel, label: gradeLevel, order: Number(gradeLevel) }],
        language,
        rolloutState: 'active',
        order: 1,
      },
    ],
    topics: [{ id: topicId, subjectId, gradeLevel, title: topicName(language), description: '', rolloutState: 'active', order: 1 }],
    units: [
      { id: unitId, subjectId, gradeLevel, topicId, title: localize(DEMO_KNOWLEDGE_POINT.name, language), description: '', rolloutState: 'active', order: 1 },
    ],
    lessons: DEMO_KNOWLEDGE_POINT.lessons.map((lesson, index) => ({
      id: lesson.lessonId,
      subjectId,
      gradeLevel,
      unitId,
      topicId,
      title: localize(lesson.title, language),
      objective: '',
      difficulty: index === 0 ? 'intro' : 'practice',
      estimatedMinutes: ESTIMATED_MINUTES,
      rolloutState: 'active',
      exerciseCount: EXERCISES[index].length,
      source: 'demo',
    })),
    rolloutSubjects: [subjectId],
    includePreview: false,
    source: 'demo',
  }
}

/**
 * `GET /practice/math/trigonometry/roadmap` after `completed`: those lessons
 * completed, the first other one current, the rest open.
 */
export function demoRoadmap(completed: readonly string[] = DEMO_COMPLETED_LESSONS, language: SupportedLanguage = 'en'): PracticeRoadmap {
  const lessons = DEMO_KNOWLEDGE_POINT.lessons
  const current = lessons.find((lesson) => !completed.includes(lesson.lessonId))?.lessonId
  const progress = lessons.filter((lesson) => completed.includes(lesson.lessonId)).length / lessons.length
  return {
    subjectId,
    topicId,
    gradeLevel,
    topic: { id: topicId, subjectId, gradeLevel, title: topicName(language), description: '', progress, ...(current ? { currentLessonId: current } : {}) },
    progress,
    ...(current ? { currentLessonId: current } : {}),
    units: [
      {
        id: unitId,
        title: localize(DEMO_KNOWLEDGE_POINT.name, language),
        description: '',
        order: 1,
        lessons: lessons.map((lesson, index) => ({
          id: lesson.lessonId,
          title: localize(lesson.title, language),
          order: index + 1,
          status: completed.includes(lesson.lessonId) ? 'completed' : lesson.lessonId === current ? 'current' : 'available',
          estimatedMinutes: ESTIMATED_MINUTES,
          subjectId,
          gradeLevel,
          topicId,
          unitId,
          challengeCount: EXERCISES[index].length,
        })),
      },
    ],
  }
}

/** The demo knowledge point's learning state after `completed`: lit once every lesson is done. */
export function demoKnowledgePointState(completed: readonly string[] = DEMO_COMPLETED_LESSONS): LearningState {
  const done = DEMO_KNOWLEDGE_POINT.lessons.filter((lesson) => completed.includes(lesson.lessonId)).length
  return done === DEMO_KNOWLEDGE_POINT.lessons.length ? 'lit' : done > 0 ? 'in_progress' : 'ready'
}

const normal = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.')

function findSpec(id: string): { spec: ExerciseSpec; lesson: number; exercise: number } | null {
  for (let lesson = 0; lesson < EXERCISES.length; lesson += 1) {
    const exercise = EXERCISES[lesson].findIndex((_, index) => challengeId(lesson, index) === id)
    if (exercise >= 0) return { spec: EXERCISES[lesson][exercise], lesson, exercise }
  }
  return null
}

/** `POST /practice/challenges/:id/answer`: the backend's check, for the demo exercises. Null for any other id. */
export function checkDemoAnswer(id: string, answer: string | string[], language: SupportedLanguage = 'en'): PracticeAnswerResult | null {
  const found = findSpec(id)
  if (!found) return null
  const challenge = challengeOf(found.spec, found.lesson, found.exercise, language)
  const expected = challenge.correctAnswer
  const correct = Array.isArray(expected)
    ? Array.isArray(answer) && answer.length === expected.length && answer.every((item, index) => item === expected[index])
    : !Array.isArray(answer) && [expected, ...(found.spec.accepted ?? [])].some((right) => normal(right) === normal(answer))
  return {
    challengeId: id,
    correct,
    feedback: correct ? challenge.correctFeedback! : challenge.incorrectFeedback!,
    ...(correct ? { explanation: challenge.explanation } : { hint: challenge.hint }),
    attemptsRemaining: correct ? 0 : 2,
    canAskLearningAssistant: true,
    canAskTeacher: true,
  }
}

/** `POST /practice/hint` for a demo exercise. Null for any other id. */
export function demoHint(id: string, language: SupportedLanguage = 'en'): PracticeHintResponse | null {
  const found = findSpec(id)
  if (!found) return null
  return { title: localize(HINT_TITLE, language), hint: localize(found.spec.hint, language), nextStep: '' }
}

/** `POST /practice/lessons/:id/complete` for a demo lesson. Null for any other id. */
export function demoLessonResult(lessonId: string, correctCount?: number): PracticeLessonResult | null {
  const index = DEMO_KNOWLEDGE_POINT.lessons.findIndex((lesson) => lesson.lessonId === lessonId)
  if (index < 0) return null
  const totalCount = EXERCISES[index].length
  return {
    lessonId,
    subjectId,
    gradeLevel,
    topicId,
    correctCount: correctCount ?? totalCount,
    totalCount,
    progressPoints: 10 * totalCount,
    studyStreak: 5,
    timeSpentSeconds: 60 * ESTIMATED_MINUTES,
    mistakes: [],
  }
}

export type DemoChapter = {
  unitId: string
  subjectId: string
  topicId: string
  gradeLevel: string
  /** Lessons done when the preview opens. */
  completed: readonly string[]
  catalog: CurriculumCatalog
  roadmap: PracticeRoadmap
  lessons: PracticeLesson[]
}

export function demoChapterFor(language: SupportedLanguage): DemoChapter {
  return {
    unitId,
    subjectId,
    topicId,
    gradeLevel,
    completed: DEMO_COMPLETED_LESSONS,
    catalog: demoCatalog(language),
    roadmap: demoRoadmap(DEMO_COMPLETED_LESSONS, language),
    lessons: demoLessons(language),
  }
}
