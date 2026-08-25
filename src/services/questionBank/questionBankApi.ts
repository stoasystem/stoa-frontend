import { httpClient } from '@/services/api/httpClient'

import type {
  QuestionBankDifficulty,
  QuestionBankFeedback,
  QuestionBankFilters,
  QuestionBankMistake,
  QuestionBankOverview,
  QuestionBankQuestion,
  QuestionBankQuestionType,
  QuestionBankSearchResult,
  QuestionBankSession,
  QuestionBankSet,
  QuestionBankSubject,
  QuestionBankSubjectOverview,
  QuestionBankTopic,
  QuestionBankTopicOverview,
} from '@/types/questionBank'

/** The Practice Library is a view over the curriculum: a lesson is a set. */
type CurriculumLesson = {
  id: string
  title: string
  objective?: string
  subjectId: string
  topicId?: string | null
  unitId?: string | null
  difficulty?: string
  estimatedMinutes?: number
  exerciseCount?: number
  gradeLevel?: string | null
}

type CurriculumExercise = {
  id: string
  lessonId: string
  subjectId: string
  topicId?: string | null
  prompt: string
  choices?: string[]
  type?: string
  difficulty?: string
  estimatedMinutes?: number
  skills?: string[]
}

type CurriculumCatalogResponse = {
  subjects: Array<{ id: string; name: string; description?: string }>
  lessons: CurriculumLesson[]
}

type CurriculumProgress = {
  completedLessonIds: string[]
  mistakeCount: number
  studyStreak?: number
  practisedToday?: boolean
  weakTopics: Array<{ topicId?: string; label?: string } | string>
}

type Curriculum = {
  subjects: CurriculumCatalogResponse['subjects']
  lessons: CurriculumLesson[]
  exercises: CurriculumExercise[]
  progress: CurriculumProgress
}

const DIFFICULTIES: Record<string, QuestionBankDifficulty> = {
  intro: 'easy',
  easy: 'easy',
  practice: 'medium',
  medium: 'medium',
  challenge: 'hard',
  hard: 'hard',
}

const QUESTION_TYPES: Record<string, QuestionBankQuestionType> = {
  multiple_choice: 'multiple_choice',
  short_answer: 'short_answer',
  numeric: 'numeric',
  step_by_step: 'step_by_step',
}

function toDifficulty(value: string | undefined): QuestionBankDifficulty {
  return DIFFICULTIES[value ?? ''] ?? 'medium'
}

function toQuestionType(exercise: CurriculumExercise): QuestionBankQuestionType {
  const declared = QUESTION_TYPES[exercise.type ?? '']
  if (declared) return declared
  return exercise.choices && exercise.choices.length > 0 ? 'multiple_choice' : 'short_answer'
}

function topicIdOf(item: { topicId?: string | null; subjectId: string }): string {
  return item.topicId || `${item.subjectId}-general`
}

async function loadCurriculum(): Promise<Curriculum> {
  const [catalog, exercises, progress] = await Promise.all([
    httpClient.get<CurriculumCatalogResponse>('/practice/curriculum/catalog'),
    httpClient.get<{ items: CurriculumExercise[] }>('/practice/curriculum/exercises'),
    httpClient.get<CurriculumProgress>('/practice/curriculum/progress'),
  ])
  return {
    subjects: catalog.data.subjects ?? [],
    lessons: catalog.data.lessons ?? [],
    exercises: exercises.data.items ?? [],
    progress: progress.data,
  }
}

function buildSet(
  lesson: CurriculumLesson,
  curriculum: Curriculum,
): QuestionBankSet {
  const exercises = curriculum.exercises.filter((item) => item.lessonId === lesson.id)
  const completed = curriculum.progress.completedLessonIds?.includes(lesson.id) ?? false
  const difficulties = [...new Set(exercises.map((item) => toDifficulty(item.difficulty)))]
  const typeCounts = new Map<QuestionBankQuestionType, number>()
  for (const exercise of exercises) {
    const type = toQuestionType(exercise)
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)
  }
  const total = exercises.length || lesson.exerciseCount || 0
  return {
    id: lesson.id,
    subjectId: lesson.subjectId,
    topicId: topicIdOf(lesson),
    title: lesson.title,
    description: lesson.objective ?? '',
    level: 'lower-secondary',
    difficultyRange: difficulties.join(' · ') || 'medium',
    difficulties,
    estimatedMinutes: lesson.estimatedMinutes ?? 10,
    questionCount: total,
    skills: [...new Set(exercises.flatMap((item) => item.skills ?? []))],
    typeBreakdown: [...typeCounts].map(([type, count]) => ({ type, count })),
    status: completed ? 'completed' : 'not_started',
    progress: { answered: completed ? total : 0, total },
  }
}

function buildTopic(
  topicId: string,
  lessons: CurriculumLesson[],
  curriculum: Curriculum,
): QuestionBankTopic {
  const sets = lessons.map((lesson) => buildSet(lesson, curriculum))
  return {
    id: topicId,
    subjectId: lessons[0]?.subjectId ?? '',
    title: lessons[0]?.topicId ? lessons[0].topicId : 'All lessons',
    description: '',
    levelTags: ['lower-secondary'],
    setCount: sets.length,
    questionCount: sets.reduce((sum, set) => sum + set.questionCount, 0),
    completedSetCount: sets.filter((set) => set.status === 'completed').length,
    accuracy: 0,
  }
}

function groupByTopic(lessons: CurriculumLesson[]): Map<string, CurriculumLesson[]> {
  const grouped = new Map<string, CurriculumLesson[]>()
  for (const lesson of lessons) {
    const key = topicIdOf(lesson)
    grouped.set(key, [...(grouped.get(key) ?? []), lesson])
  }
  return grouped
}

function buildSubject(
  subject: CurriculumCatalogResponse['subjects'][number],
  curriculum: Curriculum,
): QuestionBankSubject {
  const lessons = curriculum.lessons.filter((lesson) => lesson.subjectId === subject.id)
  const sets = lessons.map((lesson) => buildSet(lesson, curriculum))
  return {
    id: subject.id,
    title: subject.name,
    description: subject.description ?? '',
    levelTags: ['lower-secondary'],
    topicCount: groupByTopic(lessons).size,
    setCount: sets.length,
    questionCount: sets.reduce((sum, set) => sum + set.questionCount, 0),
    completedSetCount: sets.filter((set) => set.status === 'completed').length,
    accuracy: 0,
    accent: 'brand',
  }
}

function matchesFilters(set: QuestionBankSet, filters: QuestionBankFilters): boolean {
  if (filters.difficulty && filters.difficulty !== 'all') {
    if (!set.difficulties.includes(filters.difficulty)) return false
  }
  if (filters.status && filters.status !== 'all' && set.status !== filters.status) return false
  if (filters.questionType && filters.questionType !== 'all') {
    if (!set.typeBreakdown.some((entry) => entry.type === filters.questionType)) return false
  }
  if (filters.query) {
    const needle = filters.query.toLowerCase()
    if (!`${set.title} ${set.description}`.toLowerCase().includes(needle)) return false
  }
  return true
}

export async function getQuestionBankOverview(): Promise<QuestionBankOverview> {
  const curriculum = await loadCurriculum()
  const sets = curriculum.lessons.map((lesson) => buildSet(lesson, curriculum))
  const unfinished = sets.filter((set) => set.status !== 'completed')
  return {
    studyStreak: curriculum.progress.studyStreak ?? 0,
    practisedToday: curriculum.progress.practisedToday ?? false,
    subjects: curriculum.subjects.map((subject) => buildSubject(subject, curriculum)),
    recommendedSets: unfinished.slice(0, 4),
    recentPractice: sets.filter((set) => set.status === 'completed').slice(0, 4),
    continueSet: unfinished[0],
    mistakesToReview: curriculum.progress.mistakeCount ?? 0,
    savedSets: [],
  }
}

export async function getQuestionBankSubject(
  subjectId: string,
): Promise<QuestionBankSubjectOverview> {
  const curriculum = await loadCurriculum()
  const subject = curriculum.subjects.find((item) => item.id === subjectId)
  if (!subject) {
    throw new Error(`Practice Library subject not found: ${subjectId}`)
  }
  const lessons = curriculum.lessons.filter((lesson) => lesson.subjectId === subjectId)
  const sets = lessons.map((lesson) => buildSet(lesson, curriculum))
  return {
    subject: buildSubject(subject, curriculum),
    topics: [...groupByTopic(lessons)].map(([topicId, topicLessons]) =>
      buildTopic(topicId, topicLessons, curriculum),
    ),
    recommendedSets: sets.filter((set) => set.status !== 'completed').slice(0, 4),
    progress: {
      completedSets: sets.filter((set) => set.status === 'completed').length,
      answeredQuestions: sets.reduce((sum, set) => sum + set.progress.answered, 0),
      accuracy: 0,
    },
  }
}

export async function getQuestionBankTopic(
  subjectId: string,
  topicId: string,
  filters: QuestionBankFilters = {},
): Promise<QuestionBankTopicOverview> {
  const curriculum = await loadCurriculum()
  const subject = curriculum.subjects.find((item) => item.id === subjectId)
  const lessons = curriculum.lessons.filter(
    (lesson) => lesson.subjectId === subjectId && topicIdOf(lesson) === topicId,
  )
  if (!subject || lessons.length === 0) {
    throw new Error(`Practice Library topic not found: ${subjectId}/${topicId}`)
  }
  const sets = lessons.map((lesson) => buildSet(lesson, curriculum))
  return {
    subject: buildSubject(subject, curriculum),
    topic: buildTopic(topicId, lessons, curriculum),
    sets: sets.filter((set) => matchesFilters(set, filters)),
    weakAreas: [],
    progress: {
      completedSets: sets.filter((set) => set.status === 'completed').length,
      totalSets: sets.length,
      accuracy: 0,
    },
  }
}

export async function getQuestionBankSet(setId: string) {
  const curriculum = await loadCurriculum()
  const lesson = curriculum.lessons.find((item) => item.id === setId)
  if (!lesson) {
    throw new Error(`Practice Library set not found: ${setId}`)
  }
  const questions: QuestionBankQuestion[] = curriculum.exercises
    .filter((exercise) => exercise.lessonId === setId)
    .map((exercise) => ({
      id: exercise.id,
      setId,
      subjectId: exercise.subjectId,
      topicId: topicIdOf(exercise),
      type: toQuestionType(exercise),
      prompt: exercise.prompt,
      options: exercise.choices,
      // The answer stays on the server and arrives with the feedback.
      explanation: '',
      skill: exercise.skills?.[0] ?? '',
      difficulty: toDifficulty(exercise.difficulty),
    }))
  return { set: buildSet(lesson, curriculum), questions }
}

/** A session is one pass through a set. Nothing about it is stored server-side. */
export async function createQuestionBankSession(setId: string): Promise<QuestionBankSession> {
  return {
    id: setId,
    setId,
    currentQuestionIndex: 0,
    answers: [],
    startedAt: new Date().toISOString(),
  }
}

export async function getQuestionBankSession(sessionId: string) {
  const session = await createQuestionBankSession(sessionId)
  return { session, set: await getQuestionBankSet(session.setId) }
}

export async function submitQuestionBankAnswer({
  questionId,
  answer,
}: {
  questionId: string
  answer: string | string[]
}): Promise<QuestionBankFeedback> {
  const response = await httpClient.post<{
    correct: boolean
    standardAnswer?: string
    explanation?: string
    feedback?: string
  }>(`/practice/challenges/${questionId}/answer`, { answer })
  const result = response.data
  return {
    questionId,
    state: result.correct ? 'correct' : 'incorrect',
    title: result.correct ? 'Correct' : 'Not quite',
    message: result.feedback ?? '',
    explanation: result.explanation,
    correctAnswer: result.standardAnswer,
    studentAnswer: answer,
    canAskLearningAssistant: !result.correct,
  }
}

export async function completeQuestionBankSet(setId: string) {
  const response = await httpClient.post<{ nextLessonId: string | null }>(
    `/practice/lessons/${setId}/complete`,
    {},
  )
  return response.data
}

export async function getQuestionBankMistakes(
  filters: QuestionBankFilters = {},
): Promise<QuestionBankMistake[]> {
  const response = await httpClient.get<{
    items: Array<{
      id: string
      challengeId: string
      subjectId?: string
      topic?: string
      prompt?: string
      yourAnswer?: string | null
      standardAnswer?: string | null
      explanation?: string
      createdAt?: string
    }>
  }>('/practice/mistakes')
  const items = response.data.items.map((item) => ({
    id: item.id,
    questionId: item.challengeId,
    setId: '',
    setTitle: '',
    subjectId: item.subjectId ?? '',
    subjectTitle: item.subjectId ?? '',
    topicId: item.topic ?? '',
    topicTitle: item.topic ?? '',
    difficulty: 'medium' as QuestionBankDifficulty,
    prompt: item.prompt ?? '',
    studentAnswer: item.yourAnswer ?? '',
    correctAnswer: item.standardAnswer ?? '',
    explanation: item.explanation ?? '',
    reviewed: false,
    createdAt: item.createdAt ?? '',
  }))
  if (!filters.subjectId || filters.subjectId === 'all') return items
  return items.filter((item) => item.subjectId === filters.subjectId)
}

/** Saving a set is not recorded anywhere, so nothing can be listed as saved. */
export async function getQuestionBankSavedSets(): Promise<QuestionBankSet[]> {
  return []
}

export async function searchQuestionBank(query: string): Promise<QuestionBankSearchResult> {
  const curriculum = await loadCurriculum()
  const needle = query.trim().toLowerCase()
  if (!needle) return { topics: [], sets: [], questions: [] }
  const sets = curriculum.lessons
    .map((lesson) => buildSet(lesson, curriculum))
    .filter((set) => `${set.title} ${set.description}`.toLowerCase().includes(needle))
  return { topics: [], sets, questions: [] }
}
