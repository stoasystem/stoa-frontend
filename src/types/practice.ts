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
  status: 'ready'
  message: string
}

export type PracticeParentSummary = {
  lessonsCompletedThisWeek: number
  topicsPracticed: string[]
  mistakesReviewed: number
  practiceStreak: number
  currentSubject: string
  currentGradeLevel: string
  currentTopic: string
  currentTopicId: string
  currentPracticePath: string
  recommendedNextTopic: string
  supportiveNote: string
  questionsAsked?: number
  teacherSupportRequested?: number
  learningActivityNote?: string
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
  source: 'practice'
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
