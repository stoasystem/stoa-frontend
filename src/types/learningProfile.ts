export type LearningTopicLevel = 'weak' | 'developing' | 'stable' | 'strong'

export type LearningTopic = {
  id: string
  subject: string
  topic: string
  level: LearningTopicLevel
  evidenceCount: number
  lastPracticedAt?: string
}

export type LearningProfile = {
  student: {
    id: string
    name: string
    grade: string
  }
  activeSubjects: string[]
  weakTopics: LearningTopic[]
  strongTopics: LearningTopic[]
  recentHistory: {
    id: string
    title: string
    subject: string
    summary: string
    createdAt: string
  }[]
  usage: {
    aiMessagesThisMonth: number
    fileUploadsThisMonth: number
    teacherHelpRequestsThisMonth: number
  }
  teacherHelpHistory: {
    id: string
    subject: string
    status: 'pending' | 'resolved'
    summary: string
    createdAt: string
  }[]
  recommendedActions: string[]
}
