export type QuestionBankDifficulty = 'easy' | 'medium' | 'hard'
export type QuestionBankLevel = 'lower-secondary' | 'upper-secondary' | 'exam-prep'
export type QuestionBankQuestionType = 'multiple_choice' | 'short_answer' | 'numeric' | 'step_by_step'
export type QuestionSetStatus = 'not_started' | 'in_progress' | 'completed' | 'review_recommended'
export type QuestionFeedbackState =
  | 'idle'
  | 'checking'
  | 'correct'
  | 'incorrect'
  | 'partially_correct'
  | 'skipped'

export type QuestionBankSubject = {
  id: string
  title: string
  description: string
  levelTags: QuestionBankLevel[]
  topicCount: number
  setCount: number
  questionCount: number
  completedSetCount: number
  accuracy: number
  accent: string
}

export type QuestionBankTopic = {
  id: string
  subjectId: string
  title: string
  description: string
  levelTags: QuestionBankLevel[]
  setCount: number
  questionCount: number
  completedSetCount: number
  accuracy: number
  weakArea?: string
}

export type QuestionBankQuestion = {
  id: string
  setId: string
  subjectId: string
  topicId: string
  type: QuestionBankQuestionType
  prompt: string
  options?: string[]
  // Answers are evaluated on the server and never sent to the browser; the
  // right answer arrives with the feedback for a submitted attempt.
  correctAnswer?: string | string[]
  studentAnswer?: string | string[]
  explanation: string
  hint?: string
  skill: string
  difficulty: QuestionBankDifficulty
}

export type QuestionTypeBreakdown = {
  type: QuestionBankQuestionType
  count: number
}

export type QuestionSetAttempt = {
  score: number
  total: number
  timeSpentMinutes: number
  mistakes: number
  completedAt?: string
}

export type QuestionBankSet = {
  id: string
  subjectId: string
  topicId: string
  title: string
  description: string
  level: QuestionBankLevel
  difficultyRange: string
  difficulties: QuestionBankDifficulty[]
  estimatedMinutes: number
  questionCount: number
  skills: string[]
  typeBreakdown: QuestionTypeBreakdown[]
  status: QuestionSetStatus
  progress: {
    answered: number
    total: number
  }
  lastAttempt?: QuestionSetAttempt
  saved?: boolean
  recommended?: boolean
}

export type QuestionBankSessionAnswer = {
  questionId: string
  answer: string | string[]
  state: QuestionFeedbackState
}

export type QuestionBankSession = {
  id: string
  setId: string
  currentQuestionIndex: number
  answers: QuestionBankSessionAnswer[]
  startedAt: string
}

export type QuestionBankFeedback = {
  questionId: string
  state: QuestionFeedbackState
  title: string
  message: string
  explanation?: string
  correctAnswer?: string | string[]
  studentAnswer?: string | string[]
  canAskLearningAssistant: boolean
}

export type QuestionBankResult = {
  sessionId: string
  setId: string
  score: number
  total: number
  timeSpentMinutes: number
  accuracyByTopic: Array<{
    topicId: string
    topicTitle: string
    accuracy: number
  }>
  incorrectQuestions: QuestionBankMistake[]
  skippedQuestions: QuestionBankMistake[]
  nextSteps: string[]
}

export type QuestionBankMistake = {
  id: string
  questionId: string
  setId: string
  setTitle: string
  subjectId: string
  subjectTitle: string
  topicId: string
  topicTitle: string
  difficulty: QuestionBankDifficulty
  prompt: string
  studentAnswer: string
  correctAnswer: string
  explanation: string
  reviewed: boolean
  createdAt: string
}

export type QuestionBankFilters = {
  level?: QuestionBankLevel | 'all'
  difficulty?: QuestionBankDifficulty | 'all'
  questionType?: QuestionBankQuestionType | 'all'
  status?: QuestionSetStatus | 'all'
  subjectId?: string | 'all'
  topicId?: string | 'all'
  query?: string
}

export type QuestionBankOverview = {
  subjects: QuestionBankSubject[]
  recommendedSets: QuestionBankSet[]
  recentPractice: QuestionBankSet[]
  continueSet?: QuestionBankSet
  mistakesToReview: number
  savedSets: QuestionBankSet[]
}

export type QuestionBankSubjectOverview = {
  subject: QuestionBankSubject
  topics: QuestionBankTopic[]
  recommendedSets: QuestionBankSet[]
  progress: {
    completedSets: number
    answeredQuestions: number
    accuracy: number
  }
}

export type QuestionBankTopicOverview = {
  subject: QuestionBankSubject
  topic: QuestionBankTopic
  sets: QuestionBankSet[]
  weakAreas: string[]
  progress: {
    completedSets: number
    totalSets: number
    accuracy: number
  }
}

export type QuestionBankSearchResult = {
  topics: QuestionBankTopic[]
  sets: QuestionBankSet[]
  questions: QuestionBankQuestion[]
}

export type QuestionBankChatContext = {
  source: 'question-bank'
  subjectId: string
  topicId: string
  setId: string
  questionId: string
  topic: string
  setTitle: string
  challengePrompt: string
  studentAnswer?: string
  correctAnswer?: string
  returnTo?: string
}

export type QuestionBankChatLocationState = {
  questionBankContext?: QuestionBankChatContext
  prompt?: string
}
