export type PracticeGradeLevel = {
  id: string
  label: string
  order: number
}

export type PracticeLessonStatus = 'locked' | 'available' | 'completed'
export type RoadmapLessonStatus = 'completed' | 'current' | 'available' | 'locked' | 'review'
export type PracticeLessonDifficulty = 'intro' | 'practice' | 'review'
/**
 * `multi_select` (stoa-backend#593): a set of options is picked, judged as a
 * set; an option may also be a hotspot in the question's figure.
 * `grid_drawing` (stoa-backend#594): points, segments or a polygon are drawn
 * on a coordinate grid.
 */
export type PracticeChallengeType =
  | 'multiple_choice'
  | 'multi_select'
  | 'text_input'
  | 'ordering'
  | 'explanation'
  | 'grid_drawing'

export type PracticeRoadmapTopic = {
  id: string
  subjectId: string
  gradeLevel: string
  title: string
  description: string
  progress: number
  currentLessonId?: string
}

export type PracticeRoadmapLesson = {
  id: string
  title: string
  description?: string
  order: number
  status: RoadmapLessonStatus
  estimatedMinutes?: number
  unlockCondition?: string
  subjectId: string
  gradeLevel: string
  topicId: string
  unitId: string
  challengeCount: number
}

export type PracticeRoadmapUnit = {
  id: string
  title: string
  description: string
  order: number
  lessons: PracticeRoadmapLesson[]
}

export type PracticeRoadmap = {
  subjectId: string
  topicId: string
  gradeLevel: string
  topic: PracticeRoadmapTopic
  progress: number
  currentLessonId?: string
  units: PracticeRoadmapUnit[]
}

/**
 * The drawings an exercise may carry (stoa-backend#127, #504), on every
 * student reply that hands one over: the lesson, the quiz, the review. Each is
 * one `<svg>` the backend checked against its allowlist, in the reader's
 * language; `ExerciseFigure` draws it.
 */
export type ExerciseFigures = {
  /** Under the question. Absent or null when there is none. */
  figure?: string | null
  /** One per option, in the options' order; `""` (or null) where an option has none. */
  optionFigures?: (string | null)[] | null
}

/**
 * A labelled point on a coordinate grid (stoa-backend#594): a coordinate is a
 * multiple of the grid's step, so a whole number or a half.
 */
export type GridPoint = {
  label: string
  x: number
  y: number
}

/**
 * Points, and segments and polygons joining points by label (stoa-backend#594).
 * The same shape is the figure already on a grid (`GridSpec.given`), the
 * answer to a `grid_drawing` exercise, and the right drawing a result shows.
 * Segments and polygons may name the given figure's points as well as the
 * student's own.
 */
export type GridDrawing = {
  points: GridPoint[]
  segments: string[][]
  polygons: string[][]
}

/** The most one drawing may hold; more is refused as `practice_answer_invalid`. */
export type GridLimits = {
  points: number
  segments: number
  polygons: number
}

/**
 * The grid a `grid_drawing` exercise is drawn on, without its checks or
 * solutions (stoa-backend#594). Bounds are whole numbers, `step` is 1 or 0.5;
 * `axes` draws the axes through 0 and `axisLabels` numbers them. `labels` are
 * the point names the exercise asks for, in order, to be offered first; a
 * student's labels never repeat the given figure's.
 */
export type GridSpec = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  step: number
  axes?: boolean
  axisLabels?: boolean
  labels?: string[]
  given?: GridDrawing | null
  limits: GridLimits
}

export type PracticeChallenge = ExerciseFigures & {
  /**
   * What `GET /practice/lessons/:id` actually calls it. It was declared as
   * `id` here, which is not a field the backend sends: every answer went to
   * `/practice/challenges/undefined/answer` and came back 404, so no student
   * could answer anything. The fixtures used `id` too, so 2438 tests stayed
   * green over it.
   */
  challengeId: string
  lessonId: string
  unitId: string
  subjectId: string
  gradeLevel: string
  topicId: string
  topic: string
  type: PracticeChallengeType
  prompt: string
  options?: string[]
  /** Only for a `grid_drawing` exercise: the grid it is drawn on (stoa-backend#594). */
  grid?: GridSpec | null
  /** Whether `POST /practice/hints` has a hint for this exercise. */
  hintAvailable: boolean
  correctAnswer: string | string[]
  hint?: string
  explanation?: string
  correctFeedback?: string
  incorrectFeedback?: string
}

/**
 * An exercise as the backend hands it over before it is answered: the answer
 * key and the explanation are not in it. The quiz only ever sees this much,
 * which is why the frontend cannot judge a quiz answer.
 */
export type PracticeExercise = Omit<
  PracticeChallenge,
  'correctAnswer' | 'explanation' | 'correctFeedback' | 'incorrectFeedback'
>

export type PracticeLesson = {
  id: string
  unitId: string
  subjectId: string
  gradeLevel: string
  topicId: string
  title: string
  topic: string
  difficulty: PracticeLessonDifficulty
  status: PracticeLessonStatus
  estimatedMinutes: number
  /**
   * The lesson's explanation cards, in order, shown before its exercises
   * (#692, stoa-backend#465). Already in the student's language (German where
   * a card has no translation); `body` may hold LaTeX. The backend sends an
   * empty list for a lesson without any; optional for a backend from before.
   */
  sections?: LessonSection[]
  challenges: PracticeChallenge[]
}

/** One explanation card of a lesson (#692). */
export type LessonSection = {
  id: string
  title: string
  body: string
}

export type PracticeProgress = {
  studentId: string
  subjectId: string
  gradeLevel: string
  topicId: string
  completedLessons: string[]
  currentLessonId?: string
  dailyGoalCompleted: boolean
  studyStreak: number
  progressPoints: number
}

/**
 * An answer as it is sent, by the exercise's kind: the picked option's text,
 * the typed text, the pieces of an ordering in order, -- for `multi_select`
 * (stoa-backend#593) -- the numbers of the picked options, 0 for the first,
 * each once, in any order, or -- for `grid_drawing` (stoa-backend#594) -- a
 * drawing.
 */
export type PracticeAnswer = string | string[] | number[] | GridDrawing

export type PracticeAnswerRequest = {
  answer: PracticeAnswer
}

/**
 * An answer in a lesson (stoa-backend#449). `conversationId` is the Ask
 * conversation open beside the exercise, sent only when there is one: the
 * backend checks whether this exercise was asked about in it, and records a
 * right answer after that as answered after asking AI. Without it the answer
 * counts as the student's own.
 */
export type ChallengeAnswerRequest = PracticeAnswerRequest & {
  conversationId?: string
}

/**
 * One lesson quiz answer (stoa-backend `QuizAnswerSubmission`; extra fields 422).
 * `exerciseId` is the exercise it answers, so a resend after a lost reply gets
 * the first verdict back instead of being judged against the next exercise.
 */
export type LessonQuizAnswerRequest = PracticeAnswerRequest & {
  exerciseId: string
}

export type PracticeAnswerResult = {
  challengeId: string
  correct: boolean
  feedback: string
  explanation?: string
  hint?: string
  nextChallengeId?: string
  attemptsRemaining: number
  /**
   * Only for a `multi_select` exercise (stoa-backend#593): the numbers of its
   * right options, 0 for the first; null or absent for every other kind.
   */
  correctOptions?: number[] | null
  /**
   * Only for a `grid_drawing` exercise (stoa-backend#594): one drawing that is
   * right, sent once the answer is on record, right or wrong. Another drawing
   * may be right too.
   */
  standardDrawing?: GridDrawing | null
  canAskLearningAssistant?: boolean
  canAskTeacher?: boolean
}

export type LessonQuizKind = 'skip' | 'testOut'
export type LessonQuizStatus = 'inProgress' | 'passed' | 'failed'

/**
 * The short quiz that completes a lesson (stoa-backend#92). The paper, the
 * hearts and the verdict are the backend's; the stage draws what comes back
 * and nothing else.
 */
export type LessonQuizSession = {
  quizId: string
  lessonId: string
  kind: LessonQuizKind
  status: LessonQuizStatus
  heartsLeft: number
  mistakesAllowed: number
  remaining: number
  expiresAt: string
  exercise: PracticeExercise | null
}

/** One quiz answer judged. `credential` is set once, when the quiz is passed. */
export type LessonQuizAnswer = LessonQuizSession & {
  correct: boolean
  credential: string | null
  credentialExpiresAt: string | null
}

/**
 * The star quiz (stoa-backend#165): one paper over a whole knowledge point, at
 * least one exercise from each lesson, 6 to 10 in all, each asked once; a
 * second wrong answer loses it. Passed, the whole star lights; lost, it can be
 * taken again after `retryAt`. The paper, the count and the verdict are the
 * backend's.
 */
export type StarQuizView = {
  quizId: string
  unitId: string
  status: LessonQuizStatus
  total: number
  answered: number
  mistakes: number
  mistakesAllowed: number
  /** The paper is good for 30 minutes. */
  expiresAt: string
  /** What it asks now, without its answer; null once it is over. */
  exercise: PracticeExercise | null
  /** When a lost quiz can be taken again; null otherwise. */
  retryAt: string | null
}

/** One star quiz answer judged. Sent again, it gives the first result back (#113). */
export type StarQuizAnswer = StarQuizView & { correct: boolean }

export type PracticeLessonResult = {
  lessonId: string
  subjectId: string
  gradeLevel: string
  topicId: string
  correctCount: number
  totalCount: number
  progressPoints: number
  studyStreak: number
  timeSpentSeconds: number
  mistakes: PracticeMistake[]
}

export type PracticeMistake = {
  id: string
  subjectId: string
  subjectName: string
  gradeLevel: string
  topicId: string
  lessonId: string
  lessonTitle: string
  challengeId: string
  topic: string
  prompt: string
  studentAnswer: string
  correctAnswer: string
  hint: string
  reviewed: boolean
  createdAt: string
}

/**
 * One press of Hint. The key names the press, not the exercise: the backend
 * counts each new key against the day's hints, so a press that failed on the
 * way is sent again with the same key (#325).
 */
export type PracticeHintRequest = {
  challengeId: string
  /** 1-64 of `[A-Za-z0-9._~-]`. */
  idempotencyKey: string
}

/** `hint` is null when the exercise has no approved hint. */
export type PracticeHintResponse = {
  challengeId: string
  hintAvailable: boolean
  hint: string | null
}

export type CurriculumRolloutState = 'seed' | 'draft' | 'reviewed' | 'active' | 'archived'

export type CurriculumSubject = {
  id: string
  name: string
  description: string
  gradeLevels: PracticeGradeLevel[]
  language: string
  rolloutState: CurriculumRolloutState
  order: number
}

export type CurriculumTopic = {
  id: string
  subjectId: string
  gradeLevel: string
  title: string
  description: string
  rolloutState: CurriculumRolloutState
  order: number
}

export type CurriculumUnit = {
  id: string
  subjectId: string
  gradeLevel: string
  topicId: string
  title: string
  description: string
  rolloutState: CurriculumRolloutState
  order: number
}

export type CurriculumLessonSummary = {
  id: string
  subjectId: string
  gradeLevel: string
  unitId: string
  topicId: string
  title: string
  objective: string
  difficulty: string
  estimatedMinutes: number
  rolloutState: CurriculumRolloutState
  exerciseCount: number
  source: string
}

export type CurriculumExercise = {
  id: string
  lessonId: string
  subjectId: string
  topicId: string
  type: string
  prompt: string
  choices?: string[]
  difficulty: string
  estimatedMinutes: number
  skills: string[]
  rolloutState: CurriculumRolloutState
  source: string
  explanation?: string | null
  answerKey?: string | string[] | null
}

export type CurriculumCatalog = {
  subjects: CurriculumSubject[]
  topics: CurriculumTopic[]
  units: CurriculumUnit[]
  lessons: CurriculumLessonSummary[]
  rolloutSubjects: string[]
  includePreview: boolean
  source: string
}

export type CurriculumProgressSummary = {
  studentId: string
  subjectId?: string | null
  completedLessons: number
  completedLessonIds: string[]
  mistakeCount: number
  studyStreak: number
  practisedToday: boolean
  weakTopics: Array<{ topicId: string; count: number }>
  source: string
}

export type PracticeTeacherHelpRequest = {
  subjectId: string
  gradeLevel?: string
  topicId?: string
  lessonId: string
  challengeId: string
  message: string
  practiceContext?: PracticeTeacherRequestContext
}

export type PracticeTeacherHelpResponse = {
  requestId: string
  conversationId: string
  status: string
  teacherName: string | null
}

export type PracticeChatContext = {
  source: 'practice'
  subjectId: string
  gradeLevel: string
  topicId: string
  unitId?: string
  lessonId: string
  challengeId: string
  challengePrompt: string
  studentAnswer?: string
  correctAnswer?: string
  attempts?: number
  hintViewed?: boolean
  learningChatExplanationRequested?: boolean
  topic: string
  returnTo?: string
}

export type PracticeTeacherRequestContext = {
  source: 'practice' | 'question-bank'
  subjectId: string
  gradeLevel: string
  topicId: string
  unitId?: string
  lessonId: string
  challengeId: string
  challengePrompt?: string
  topic: string
  studentAnswer?: string
  correctAnswer?: string
  attempts: number
  hintViewed?: boolean
  learningChatExplanationRequested?: boolean
}

export type PracticeChatLocationState = {
  practiceContext?: PracticeChatContext
  prompt?: string
}

export type ReviewCard = ExerciseFigures & {
  challengeId: string
  lessonId: string
  subjectId: string
  topicId: string
  prompt: string
  options: string[]
  type: string
  /** Only for a `grid_drawing` card: the grid it is drawn on (stoa-backend#594). */
  grid?: GridSpec | null
  dueAt: string
  lapses: number
  reps: number
  /** Why it is due now (stoa-backend#447); absent on cards from before that. */
  reason?: ReviewReason | null
}

/**
 * `ReviewCard.reason` (stoa-backend#447). The student is shown a band in
 * words, never `retrievability` as a percentage (decided on #447). `band` is
 * null for a card with no answer behind it, whose recall cannot be estimated.
 */
export type ReviewReason = {
  daysOverdue: number
  retrievability: number | null
  targetRetention: number
  latestWrong: boolean
  band: 'fresh' | 'fading' | 'forgetting' | 'forgotten' | null
  /** The band in the request's language, from the server's own catalog. */
  bandLabel: string | null
}

export type ReviewDueResponse = {
  items: ReviewCard[]
  dueCount: number
  generatedAt: string
}

export type ReviewSummary = {
  dueCount: number
  scheduledCount: number
  nextDueAt: string
}

/**
 * `GET /practice/knowledge-map` (stoa-backend#59): the sky the star map draws.
 *
 * The field names are the star map model's own (`@/features/starmap/model/starMap`),
 * so the source maps it across without renaming. `prerequisites` and each star's
 * `skills` arrive empty until stoa-backend#56 and #58 land; the map draws no
 * skill rows while they are.
 */
export type KnowledgeMapResponse = {
  subjectId: string
  galaxies: {
    subjectId: string
    name: string
    lit: number
    total: number
    enrolled: boolean
  }[]
  nebulae: { topicId: string; name: string; order: number; subjectId: string }[]
  stars: {
    unitId: string
    name: string
    nebulaId: string
    order: number
    /**
     * Nothing is locked since stoa-backend#125 (ADR 0004); `locked` is only
     * what a backend from before it still says, read as ready.
     */
    state: 'lit' | 'in_progress' | 'ready' | 'locked'
    /**
     * The stated prerequisites not lit yet, in the order stated; empty for a
     * lit star (stoa-backend#125). Missing only from a backend before it.
     */
    unlitPrerequisiteIds?: string[]
    progress: number
    unmetExercises: number
    reviewDue: number
    /**
     * Why the system recommends it (stoa-backend#164): `in_progress`, `after_lit`
     * (then `relatedUnitId` is the star whose lighting it follows), `start`, or
     * `grade`: where the profile's year group begins in a subject not started
     * yet (stoa-backend#310). Missing from a backend before it; a teacher's
     * recommendation has none.
     */
    recommendation: {
      source: 'system' | 'teacher'
      reason?: 'in_progress' | 'after_lit' | 'start' | 'grade'
      relatedUnitId?: string | null
    } | null
    x: number
    y: number
    /**
     * `extension` and `missingPrerequisites` only when they apply
     * (stoa-backend#127, #501); a `unitId` naming this very star means its
     * earlier stages.
     */
    skills: {
      skillId: string
      name: string
      lit: boolean
      extension?: boolean
      missingPrerequisites?: { unitId: string; name: string }[]
    }[]
    chapter: {
      lessonCount: number
      lessonsDone: number
      nextLesson: { lessonId: string; title: string } | null
    }
    /** When the point was first lit, ISO 8601 (stoa-backend#71). */
    litAt?: string | null
    /**
     * Seen happening, written by the backfill (stoa-backend#71), or lit by
     * passing the star quiz (stoa-backend#165). The backfill's is never celebrated.
     */
    litAtSource?: 'observed' | 'backfilled' | 'quiz' | null
    /** When a lost star quiz can be taken again; null when it can now (stoa-backend#165). */
    starQuizRetryAt?: string | null
  }[]
  prerequisites: { from: string; to: string }[]
  summary: { lit: number; total: number; streakDays: number; score: number }
  /**
   * The points lit and not yet acknowledged by this student (stoa-backend#71),
   * oldest first: what the lighting moment celebrates
   * (`features/starmap/lighting/readModelLighting.tsx`). Observed lightings
   * only; the backfill's are never listed.
   */
  unacknowledgedLit?: string[]
  /**
   * `skeleton` (#503, stoa-backend#127): every star with its state and place,
   * and every `skills` left empty -- not computed, rather than none. The few
   * stars around one come in full from `/knowledge-map/stars`. Absent: the
   * whole sky in full, as a backend before #127 sends it.
   */
  view?: 'full' | 'skeleton'
}

export type KnowledgeMapStar = KnowledgeMapResponse['stars'][number]

/** One practice set of a star, in its order, under its small star (#503). */
export type KnowledgeMapPracticeSet = {
  lessonId: string
  title: string
  order: number
  exerciseCount: number
  skillId: string | null
  status: 'completed' | 'available'
  extension?: boolean
}

/** A star around the one in focus, in full: small stars, practice sets, what it needs (#503). */
export type KnowledgeMapNeighbour = KnowledgeMapStar & {
  relation: 'focus' | 'prerequisite' | 'next' | 'neighbour'
  prerequisiteUnitIds: string[]
  practiceSets: KnowledgeMapPracticeSet[]
}

/**
 * `GET /practice/knowledge-map/stars` (#503): a star and at most fifteen
 * around it -- its prerequisites, the stars that need it, its neighbours in
 * its nebula. Without `around`, the star the student last practised in, else
 * the map's recommendation; `focus` is null when the subject has no star.
 */
export type KnowledgeMapNeighbourhood = {
  subjectId: string
  focus: string | null
  stars: KnowledgeMapNeighbour[]
}
