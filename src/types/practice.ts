export type PracticeSubject = {
  id: string
  name: string
  description: string
  gradeLevels: PracticeGradeLevel[]
  progress: number
  accent: string
}

export type PracticeGradeLevel = {
  id: string
  label: string
  order: number
}

export type PracticeTopicStatus = 'available' | 'coming_later'
export type PracticeUnitStatus = 'locked' | 'available' | 'completed'
export type PracticeLessonStatus = 'locked' | 'available' | 'completed'
export type RoadmapLessonStatus = 'completed' | 'current' | 'available' | 'locked' | 'review'
export type PracticeLessonDifficulty = 'intro' | 'practice' | 'review'
export type PracticeChallengeType = 'multiple_choice' | 'text_input' | 'ordering' | 'explanation'

export type PracticeTopic = {
  id: string
  subjectId: string
  gradeLevel: string
  title: string
  description: string
  order: number
  status: PracticeTopicStatus
  progress?: number
  currentLessonId?: string
}

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
  challenges: PracticeChallenge[]
}

export type LearningUnit = {
  id: string
  subjectId: string
  gradeLevel: string
  topicId: string
  title: string
  description: string
  order: number
  status: PracticeUnitStatus
  lessons: PracticeLesson[]
}

export type PracticePath = {
  subjectId: string
  gradeLevel: string
  topicId: string
  topicTitle: string
  units: LearningUnit[]
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

export type PracticeAnswerRequest = {
  answer: string | string[]
}

export type PracticeAnswerResult = {
  challengeId: string
  correct: boolean
  feedback: string
  explanation?: string
  hint?: string
  nextChallengeId?: string
  attemptsRemaining: number
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

export type PracticeOverview = {
  subjects: PracticeSubject[]
  topics: PracticeTopic[]
  recommendedLesson: PracticeLesson
  dailyGoal: {
    completed: number
    target: number
    label: string
  }
  studyStreak: number
  progressPoints: number
  recentMistakes: PracticeMistake[]
  weakTopics: Array<{
    id: string
    subject: string
    topic: string
    note: string
  }>
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
  dueAt: string
  lapses: number
  reps: number
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
 * locks and no skill rows while they are.
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
    state: 'lit' | 'in_progress' | 'ready' | 'locked'
    progress: number
    unmetExercises: number
    reviewDue: number
    recommendation: { source: 'system' | 'teacher' } | null
    x: number
    y: number
    skills: { skillId: string; name: string; lit: boolean }[]
    chapter: {
      lessonCount: number
      lessonsDone: number
      nextLesson: { lessonId: string; title: string } | null
    }
    /** When the point was first lit, ISO 8601 (stoa-backend#71). */
    litAt?: string | null
    /** Seen happening, or written by the backfill (stoa-backend#71). Only `observed` is ever celebrated. */
    litAtSource?: 'observed' | 'backfilled' | null
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
}
