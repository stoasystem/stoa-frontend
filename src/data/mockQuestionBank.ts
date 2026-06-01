import type {
  QuestionBankDifficulty,
  QuestionBankFeedback,
  QuestionBankFilters,
  QuestionBankMistake,
  QuestionBankOverview,
  QuestionBankQuestion,
  QuestionBankQuestionType,
  QuestionBankResult,
  QuestionBankSearchResult,
  QuestionBankSession,
  QuestionBankSet,
  QuestionBankSubject,
  QuestionBankSubjectOverview,
  QuestionBankTopic,
  QuestionBankTopicOverview,
  QuestionFeedbackState,
  QuestionSetStatus,
} from '@/types/questionBank'

export const questionBankSubjects: QuestionBankSubject[] = [
  {
    id: 'mathematics',
    title: 'Mathematics',
    description: 'Equation practice, fractions, geometry, functions, and exam-ready problem solving.',
    levelTags: ['lower-secondary', 'upper-secondary', 'exam-prep'],
    topicCount: 6,
    setCount: 18,
    questionCount: 360,
    completedSetCount: 7,
    accuracy: 78,
    accent: 'hsl(var(--stoa-brand-burgundy))',
  },
  {
    id: 'physics',
    title: 'Physics',
    description: 'Forces, motion, energy, waves, and formula confidence.',
    levelTags: ['lower-secondary', 'upper-secondary'],
    topicCount: 4,
    setCount: 9,
    questionCount: 150,
    completedSetCount: 2,
    accuracy: 71,
    accent: 'hsl(var(--stoa-brand-charcoal))',
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    description: 'Atoms, reactions, bonding, and calculation practice.',
    levelTags: ['lower-secondary', 'upper-secondary'],
    topicCount: 4,
    setCount: 8,
    questionCount: 128,
    completedSetCount: 1,
    accuracy: 69,
    accent: 'hsl(154 31% 34%)',
  },
  {
    id: 'biology',
    title: 'Biology',
    description: 'Cells, body systems, ecology, and vocabulary checks.',
    levelTags: ['lower-secondary', 'upper-secondary'],
    topicCount: 5,
    setCount: 10,
    questionCount: 180,
    completedSetCount: 3,
    accuracy: 82,
    accent: 'hsl(207 30% 38%)',
  },
]

export const questionBankTopics: QuestionBankTopic[] = [
  topic('arithmetic', 'mathematics', 'Arithmetic', 'Fractions, percentages, ratios, and number fluency.', 4, 80, 2, 81),
  topic('algebra', 'mathematics', 'Algebra', 'Equations, expressions, inequalities, and symbolic reasoning.', 5, 96, 2, 74, 'equations with fractions'),
  topic('geometry', 'mathematics', 'Geometry', 'Angles, shapes, area, and coordinate reasoning.', 3, 54, 1, 77),
  topic('functions', 'mathematics', 'Functions', 'Graphs, tables, and linear relationships.', 2, 42, 0, 68, 'reading slope from graphs'),
  topic('probability', 'mathematics', 'Probability', 'Chance, outcomes, and simple probability models.', 2, 38, 1, 83),
  topic('statistics', 'mathematics', 'Statistics', 'Averages, spread, charts, and interpretation.', 2, 50, 1, 79),
  topic('motion', 'physics', 'Motion', 'Speed, distance, acceleration, and graph reading.', 3, 50, 1, 72),
  topic('forces', 'physics', 'Forces', 'Force diagrams, Newton laws, and balanced forces.', 2, 36, 0, 68, 'net force diagrams'),
  topic('energy', 'physics', 'Energy', 'Energy stores, transfers, and efficiency.', 2, 34, 1, 75),
  topic('waves', 'physics', 'Waves', 'Wave properties, sound, and light basics.', 2, 30, 0, 70),
  topic('atoms', 'chemistry', 'Atoms', 'Atomic structure, elements, and periodic trends.', 2, 36, 0, 66),
  topic('reactions', 'chemistry', 'Reactions', 'Word equations, balancing, and reaction evidence.', 2, 32, 1, 73),
  topic('cells', 'biology', 'Cells', 'Cell structure, microscopes, and organelles.', 2, 38, 1, 84),
  topic('ecology', 'biology', 'Ecology', 'Food webs, ecosystems, and adaptations.', 2, 34, 1, 80),
]

export const questionBankSets: QuestionBankSet[] = [
  set({
    id: 'linear-equations-basics',
    subjectId: 'mathematics',
    topicId: 'algebra',
    title: 'Linear Equations Basics',
    description: 'Solve one-step and two-step equations with clear checking habits.',
    difficultyRange: 'Easy to Medium',
    difficulties: ['easy', 'medium'],
    estimatedMinutes: 15,
    questionCount: 10,
    skills: ['Understand equations as balance', 'Solve one-step equations', 'Solve two-step equations', 'Check solutions'],
    status: 'in_progress',
    progress: { answered: 6, total: 10 },
    typeBreakdown: [
      { type: 'multiple_choice', count: 4 },
      { type: 'short_answer', count: 3 },
      { type: 'numeric', count: 2 },
      { type: 'step_by_step', count: 1 },
    ],
    lastAttempt: { score: 7, total: 10, timeSpentMinutes: 12, mistakes: 3, completedAt: '2026-05-31' },
    recommended: true,
    saved: true,
  }),
  set({
    id: 'equations-with-fractions',
    subjectId: 'mathematics',
    topicId: 'algebra',
    title: 'Solving Equations with Fractions',
    description: 'Practise clearing denominators and checking fractional solutions.',
    difficultyRange: 'Medium',
    difficulties: ['medium'],
    estimatedMinutes: 18,
    questionCount: 8,
    skills: ['Clear fractions', 'Keep both sides balanced', 'Check substituted values'],
    status: 'review_recommended',
    progress: { answered: 8, total: 8 },
    typeBreakdown: [
      { type: 'short_answer', count: 4 },
      { type: 'numeric', count: 2 },
      { type: 'step_by_step', count: 2 },
    ],
    lastAttempt: { score: 5, total: 8, timeSpentMinutes: 17, mistakes: 3, completedAt: '2026-05-30' },
    recommended: true,
  }),
  set({
    id: 'word-problems-equations',
    subjectId: 'mathematics',
    topicId: 'algebra',
    title: 'Word Problems: Equations',
    description: 'Turn short school problems into equations before solving.',
    difficultyRange: 'Medium to Hard',
    difficulties: ['medium', 'hard'],
    estimatedMinutes: 20,
    questionCount: 10,
    skills: ['Identify unknowns', 'Write equations', 'Interpret solutions'],
    status: 'not_started',
    progress: { answered: 0, total: 10 },
    typeBreakdown: [
      { type: 'multiple_choice', count: 2 },
      { type: 'short_answer', count: 4 },
      { type: 'step_by_step', count: 4 },
    ],
    recommended: true,
  }),
  set({
    id: 'fractions-review',
    subjectId: 'mathematics',
    topicId: 'arithmetic',
    title: 'Fractions Review',
    description: 'Refresh equivalent fractions, addition, and simplifying.',
    difficultyRange: 'Easy',
    difficulties: ['easy'],
    estimatedMinutes: 12,
    questionCount: 9,
    skills: ['Equivalent fractions', 'Add fractions', 'Simplify answers'],
    status: 'completed',
    progress: { answered: 9, total: 9 },
    typeBreakdown: [
      { type: 'multiple_choice', count: 5 },
      { type: 'numeric', count: 4 },
    ],
    lastAttempt: { score: 8, total: 9, timeSpentMinutes: 10, mistakes: 1, completedAt: '2026-05-29' },
    recommended: true,
  }),
  set({
    id: 'geometry-angles',
    subjectId: 'mathematics',
    topicId: 'geometry',
    title: 'Geometry: Angles',
    description: 'Use angle facts around points, lines, and triangles.',
    difficultyRange: 'Easy to Medium',
    difficulties: ['easy', 'medium'],
    estimatedMinutes: 14,
    questionCount: 10,
    skills: ['Angles on a line', 'Triangle angle sum', 'Vertically opposite angles'],
    status: 'not_started',
    progress: { answered: 0, total: 10 },
    typeBreakdown: [
      { type: 'multiple_choice', count: 6 },
      { type: 'numeric', count: 4 },
    ],
    recommended: true,
  }),
  set({
    id: 'speed-distance-time',
    subjectId: 'physics',
    topicId: 'motion',
    title: 'Speed, Distance, Time',
    description: 'Practise the core motion formula and unit checks.',
    difficultyRange: 'Easy to Medium',
    difficulties: ['easy', 'medium'],
    estimatedMinutes: 16,
    questionCount: 8,
    skills: ['Choose the formula', 'Rearrange speed equations', 'Check units'],
    status: 'in_progress',
    progress: { answered: 3, total: 8 },
    typeBreakdown: [
      { type: 'numeric', count: 4 },
      { type: 'short_answer', count: 2 },
      { type: 'step_by_step', count: 2 },
    ],
  }),
]

export const questionBankQuestions: QuestionBankQuestion[] = [
  question({
    id: 'q-linear-1',
    setId: 'linear-equations-basics',
    type: 'multiple_choice',
    prompt: 'Which value of x solves 2x + 3 = 11?',
    options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
    correctAnswer: 'x = 4',
    explanation: 'Subtract 3 from both sides to get 2x = 8, then divide both sides by 2.',
    hint: 'Undo the +3 first, then undo the multiplication by 2.',
    skill: 'Solve two-step equations',
    difficulty: 'easy',
  }),
  question({
    id: 'q-linear-2',
    setId: 'linear-equations-basics',
    type: 'short_answer',
    prompt: 'Solve x + 5 = 12.',
    correctAnswer: 'x = 7',
    explanation: 'Subtract 5 from both sides. That leaves x = 7.',
    hint: 'What number do you subtract from both sides to isolate x?',
    skill: 'Solve one-step equations',
    difficulty: 'easy',
  }),
  question({
    id: 'q-linear-3',
    setId: 'linear-equations-basics',
    type: 'numeric',
    prompt: 'What is the value of x in 3x = 18?',
    correctAnswer: '6',
    explanation: 'Divide both sides by 3. 18 divided by 3 is 6.',
    hint: 'The inverse of multiplying by 3 is dividing by 3.',
    skill: 'Solve one-step equations',
    difficulty: 'easy',
  }),
  question({
    id: 'q-linear-4',
    setId: 'linear-equations-basics',
    type: 'step_by_step',
    prompt: 'Solve 4x - 6 = 10. Show the first operation, the simplified equation, and the final answer.',
    correctAnswer: ['Add 6 to both sides', '4x = 16', 'x = 4'],
    explanation: 'Add 6 to both sides to get 4x = 16. Then divide both sides by 4, so x = 4.',
    hint: 'Start by removing the -6 term.',
    skill: 'Show equation steps',
    difficulty: 'medium',
  }),
  question({
    id: 'q-linear-5',
    setId: 'linear-equations-basics',
    type: 'short_answer',
    prompt: 'Solve 5x + 2 = 22.',
    correctAnswer: 'x = 4',
    explanation: 'Subtract 2 from both sides to get 5x = 20. Divide by 5 to get x = 4.',
    hint: 'Use two inverse operations in order.',
    skill: 'Solve two-step equations',
    difficulty: 'medium',
  }),
  question({
    id: 'q-fraction-1',
    setId: 'equations-with-fractions',
    type: 'short_answer',
    prompt: 'Solve x / 3 + 2 = 6.',
    correctAnswer: 'x = 12',
    explanation: 'Subtract 2 to get x / 3 = 4, then multiply by 3.',
    hint: 'Isolate x / 3 first.',
    skill: 'Clear fractions',
    difficulty: 'medium',
  }),
  question({
    id: 'q-word-1',
    setId: 'word-problems-equations',
    type: 'step_by_step',
    prompt: 'A number doubled and increased by 3 is 17. Write and solve the equation.',
    correctAnswer: ['2x + 3 = 17', '2x = 14', 'x = 7'],
    explanation: 'The phrase doubled and increased by 3 gives 2x + 3. Solve by subtracting 3 and dividing by 2.',
    hint: 'Use x for the unknown number.',
    skill: 'Write equations from words',
    difficulty: 'medium',
  }),
  question({
    id: 'q-fractions-review-1',
    setId: 'fractions-review',
    type: 'multiple_choice',
    prompt: 'Which fraction is equivalent to 2/3?',
    options: ['3/4', '4/6', '5/8', '6/7'],
    correctAnswer: '4/6',
    explanation: 'Multiplying numerator and denominator by 2 gives 4/6.',
    hint: 'Equivalent fractions keep the same value.',
    skill: 'Equivalent fractions',
    difficulty: 'easy',
  }),
  question({
    id: 'q-angles-1',
    setId: 'geometry-angles',
    type: 'numeric',
    prompt: 'Two angles on a straight line are 65° and x°. What is x?',
    correctAnswer: '115',
    explanation: 'Angles on a straight line add to 180°. 180 - 65 = 115.',
    hint: 'Straight-line angles add to 180°.',
    skill: 'Angles on a line',
    difficulty: 'easy',
  }),
  question({
    id: 'q-speed-1',
    setId: 'speed-distance-time',
    type: 'numeric',
    prompt: 'A cyclist travels 24 km in 2 hours. What is the speed in km/h?',
    correctAnswer: '12',
    explanation: 'Speed equals distance divided by time. 24 ÷ 2 = 12 km/h.',
    hint: 'Use speed = distance ÷ time.',
    skill: 'Calculate speed',
    difficulty: 'easy',
  }),
]

export function getMockQuestionBankOverview(): QuestionBankOverview {
  return {
    subjects: questionBankSubjects,
    recommendedSets: questionBankSets.filter((setItem) => setItem.recommended).slice(0, 4),
    recentPractice: questionBankSets.filter((setItem) => setItem.lastAttempt || setItem.status === 'in_progress').slice(0, 4),
    continueSet: questionBankSets.find((setItem) => setItem.status === 'in_progress'),
    mistakesToReview: getMockQuestionBankMistakes().length,
    savedSets: questionBankSets.filter((setItem) => setItem.saved),
  }
}

export function getMockQuestionBankSubject(subjectId: string): QuestionBankSubjectOverview | undefined {
  const subject = questionBankSubjects.find((item) => item.id === subjectId)
  if (!subject) return undefined

  const subjectTopics = questionBankTopics.filter((item) => item.subjectId === subjectId)
  const subjectSets = questionBankSets.filter((item) => item.subjectId === subjectId)
  const answeredQuestions = subjectSets.reduce((total, setItem) => total + setItem.progress.answered, 0)

  return {
    subject,
    topics: subjectTopics,
    recommendedSets: subjectSets.filter((setItem) => setItem.recommended).slice(0, 3),
    progress: {
      completedSets: subject.completedSetCount,
      answeredQuestions,
      accuracy: subject.accuracy,
    },
  }
}

export function getMockQuestionBankTopic(subjectId: string, topicId: string): QuestionBankTopicOverview | undefined {
  const subject = questionBankSubjects.find((item) => item.id === subjectId)
  const topicItem = questionBankTopics.find((item) => item.subjectId === subjectId && item.id === topicId)
  if (!subject || !topicItem) return undefined

  return {
    subject,
    topic: topicItem,
    sets: questionBankSets.filter((setItem) => setItem.subjectId === subjectId && setItem.topicId === topicId),
    weakAreas: [topicItem.weakArea, 'checking final answers', 'choosing the first inverse operation'].filter(Boolean) as string[],
    progress: {
      completedSets: topicItem.completedSetCount,
      totalSets: topicItem.setCount,
      accuracy: topicItem.accuracy,
    },
  }
}

export function getMockQuestionBankSet(setId: string) {
  return questionBankSets.find((setItem) => setItem.id === setId)
}

export function getMockQuestionBankQuestionsForSet(setId: string) {
  return questionBankQuestions.filter((questionItem) => questionItem.setId === setId)
}

export function getMockQuestionBankQuestion(questionId: string) {
  return questionBankQuestions.find((questionItem) => questionItem.id === questionId)
}

export function getMockQuestionBankSession(sessionId: string): QuestionBankSession {
  const setId = sessionId.replace(/^review-/, '').replace(/^session-/, '').replace(/^demo-/, '') || 'linear-equations-basics'
  return {
    id: sessionId,
    setId,
    currentQuestionIndex: 0,
    answers: [],
    startedAt: new Date('2026-06-02T08:00:00.000Z').toISOString(),
  }
}

export function createMockQuestionBankSession(setId: string) {
  return getMockQuestionBankSession(`session-${setId}`)
}

export function evaluateMockQuestionBankAnswer(
  questionId: string,
  answer: string | string[] | undefined,
): QuestionBankFeedback {
  const questionItem = getMockQuestionBankQuestion(questionId)
  if (!questionItem) {
    throw new Error(`Question not found: ${questionId}`)
  }

  if (!answer || (Array.isArray(answer) && answer.every((part) => !part.trim()))) {
    return feedback(questionItem, 'skipped', 'Skipped', 'You can come back before finishing the set.', answer)
  }

  const correct = answersMatch(answer, questionItem.correctAnswer)
  if (correct) {
    return feedback(questionItem, 'correct', 'Correct', 'Good work. The reasoning is on track.', answer)
  }

  const partial = Array.isArray(answer) && answer.some((part) => part.trim())
  return feedback(
    questionItem,
    partial ? 'partially_correct' : 'incorrect',
    partial ? 'Partly there' : 'Not quite',
    partial
      ? 'Some steps are present, but the final reasoning still needs checking.'
      : 'Review the inverse operation, then try a similar question.',
    answer,
  )
}

export function getMockQuestionBankResult(sessionId: string): QuestionBankResult {
  const session = getMockQuestionBankSession(sessionId)
  const setItem = getMockQuestionBankSet(session.setId) ?? questionBankSets[0]
  const topicItem = questionBankTopics.find((topicCandidate) => topicCandidate.id === setItem.topicId)
  const mistakes = getMockQuestionBankMistakes().filter((mistake) => mistake.setId === setItem.id)

  return {
    sessionId,
    setId: setItem.id,
    score: Math.max(1, setItem.questionCount - Math.max(2, mistakes.length)),
    total: setItem.questionCount,
    timeSpentMinutes: setItem.lastAttempt?.timeSpentMinutes ?? setItem.estimatedMinutes,
    accuracyByTopic: [
      {
        topicId: setItem.topicId,
        topicTitle: topicItem?.title ?? 'Topic',
        accuracy: topicItem?.accuracy ?? 76,
      },
    ],
    incorrectQuestions: mistakes,
    skippedQuestions: mistakes.length > 1 ? mistakes.slice(0, 1) : [],
    nextSteps: [
      `Review ${topicItem?.title ?? 'this topic'} mistakes`,
      'Ask Learning Chat about any unclear step',
      'Continue the related Practice Path',
    ],
  }
}

export function getMockQuestionBankMistakes(filters: QuestionBankFilters = {}): QuestionBankMistake[] {
  const mistakes: QuestionBankMistake[] = [
    mistake('qb-mistake-linear-1', 'q-linear-1', 'x = 3'),
    mistake('qb-mistake-linear-4', 'q-linear-4', 'Added 6, then wrote x = 16'),
    mistake('qb-mistake-fraction-1', 'q-fraction-1', 'x = 4'),
  ]

  return mistakes.filter((mistakeItem) => {
    if (filters.subjectId && filters.subjectId !== 'all' && mistakeItem.subjectId !== filters.subjectId) return false
    if (filters.topicId && filters.topicId !== 'all' && mistakeItem.topicId !== filters.topicId) return false
    if (filters.difficulty && filters.difficulty !== 'all' && mistakeItem.difficulty !== filters.difficulty) return false
    return true
  })
}

export function getMockQuestionBankSavedSets() {
  return questionBankSets.filter((setItem) => setItem.saved)
}

export function filterMockQuestionBankSets(
  sets: QuestionBankSet[],
  filters: QuestionBankFilters,
) {
  return sets.filter((setItem) => {
    if (filters.level && filters.level !== 'all' && setItem.level !== filters.level) return false
    if (filters.difficulty && filters.difficulty !== 'all' && !setItem.difficulties.includes(filters.difficulty)) return false
    if (filters.status && filters.status !== 'all' && setItem.status !== filters.status) return false
    if (
      filters.questionType &&
      filters.questionType !== 'all' &&
      !setItem.typeBreakdown.some((breakdown) => breakdown.type === filters.questionType)
    ) {
      return false
    }
    return true
  })
}

export function searchMockQuestionBank(query: string): QuestionBankSearchResult {
  const normalized = normalize(query)
  if (!normalized) {
    return { topics: [], sets: [], questions: [] }
  }

  return {
    topics: questionBankTopics.filter((topicItem) =>
      [topicItem.title, topicItem.description, topicItem.weakArea ?? ''].some((value) => normalize(value).includes(normalized)),
    ),
    sets: questionBankSets.filter((setItem) =>
      [setItem.title, setItem.description, setItem.skills.join(' ')].some((value) => normalize(value).includes(normalized)),
    ),
    questions: questionBankQuestions.filter((questionItem) =>
      [questionItem.prompt, questionItem.skill].some((value) => normalize(value).includes(normalized)),
    ),
  }
}

function topic(
  id: string,
  subjectId: string,
  title: string,
  description: string,
  setCount: number,
  questionCount: number,
  completedSetCount: number,
  accuracy: number,
  weakArea?: string,
): QuestionBankTopic {
  return {
    id,
    subjectId,
    title,
    description,
    levelTags: ['lower-secondary', 'upper-secondary'],
    setCount,
    questionCount,
    completedSetCount,
    accuracy,
    weakArea,
  }
}

function set(setItem: Omit<QuestionBankSet, 'level'> & { level?: QuestionBankSet['level'] }): QuestionBankSet {
  return {
    level: 'lower-secondary',
    ...setItem,
  }
}

function question(
  questionItem: Omit<QuestionBankQuestion, 'subjectId' | 'topicId'>,
): QuestionBankQuestion {
  const setItem = questionBankSets.find((candidate) => candidate.id === questionItem.setId)
  return {
    subjectId: setItem?.subjectId ?? 'mathematics',
    topicId: setItem?.topicId ?? 'algebra',
    ...questionItem,
  }
}

function mistake(id: string, questionId: string, studentAnswer: string): QuestionBankMistake {
  const questionItem = getMockQuestionBankQuestion(questionId) ?? questionBankQuestions[0]
  const setItem = getMockQuestionBankSet(questionItem.setId) ?? questionBankSets[0]
  const subject = questionBankSubjects.find((subjectItem) => subjectItem.id === setItem.subjectId)
  const topicItem = questionBankTopics.find((topicCandidate) => topicCandidate.id === setItem.topicId)

  return {
    id,
    questionId,
    setId: setItem.id,
    setTitle: setItem.title,
    subjectId: setItem.subjectId,
    subjectTitle: subject?.title ?? 'Subject',
    topicId: setItem.topicId,
    topicTitle: topicItem?.title ?? 'Topic',
    difficulty: questionItem.difficulty,
    prompt: questionItem.prompt,
    studentAnswer,
    correctAnswer: answerToText(questionItem.correctAnswer),
    explanation: questionItem.explanation,
    reviewed: false,
    createdAt: '2026-06-01',
  }
}

function feedback(
  questionItem: QuestionBankQuestion,
  state: QuestionFeedbackState,
  title: string,
  message: string,
  answer?: string | string[],
): QuestionBankFeedback {
  return {
    questionId: questionItem.id,
    state,
    title,
    message,
    explanation: questionItem.explanation,
    correctAnswer: questionItem.correctAnswer,
    studentAnswer: answer,
    canAskLearningAssistant: true,
  }
}

function answersMatch(answer: string | string[], correctAnswer: string | string[]) {
  if (Array.isArray(correctAnswer)) {
    const answerParts = Array.isArray(answer) ? answer : [answer]
    return correctAnswer.every((part, index) => normalize(answerParts[index] ?? '').includes(normalize(part)))
  }

  if (Array.isArray(answer)) {
    return answer.some((part) => normalize(part) === normalize(correctAnswer))
  }

  return normalize(answer) === normalize(correctAnswer)
}

function answerToText(answer: string | string[] | undefined) {
  if (!answer) return ''
  return Array.isArray(answer) ? answer.join(' / ') : answer
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function getQuestionTypeLabel(type: QuestionBankQuestionType) {
  const labels: Record<QuestionBankQuestionType, string> = {
    multiple_choice: 'Multiple choice',
    short_answer: 'Short answer',
    numeric: 'Numeric answer',
    step_by_step: 'Step by step',
  }
  return labels[type]
}

export function getQuestionSetStatusLabel(status: QuestionSetStatus) {
  const labels: Record<QuestionSetStatus, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    completed: 'Completed',
    review_recommended: 'Review recommended',
  }
  return labels[status]
}

export function getDifficultyLabel(difficulty: QuestionBankDifficulty) {
  const labels: Record<QuestionBankDifficulty, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  }
  return labels[difficulty]
}
