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

export type PracticeChallenge = {
  id: string
  lessonId: string
  unitId: string
  subjectId: string
  gradeLevel: string
  topicId: string
  topic: string
  type: PracticeChallengeType
  prompt: string
  options?: string[]
  correctAnswer: string | string[]
  hint?: string
  explanation?: string
  correctFeedback?: string
  incorrectFeedback?: string
}

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

export type PracticeHintRequest = {
  subjectId: string
  gradeLevel?: string
  topicId?: string
  lessonId: string
  challengeId: string
  answer: string | string[]
}

export type PracticeHintResponse = {
  title: string
  hint: string
  nextStep: string
}

export type CurriculumRolloutState = 'seed' | 'draft' | 'reviewed' | 'active' | 'archived'

export type CurriculumSubject = {
  id: string
  name: string
  description: string
  gradeLevels: string[]
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
