export type ParentChild = {
  id: string
  userId: string
  name: string
  email: string
  grade: string | null
  subjects: string[]
  relationship: string
}

export type ParentChildActivity = {
  id: string
  type: 'question' | 'conversation' | 'teacher_help' | 'practice' | 'practice_mistake' | 'report' | string
  title: string
  summary: string
  subject: string | null
  createdAt: string
}

/**
 * One star's exercises answered right (stoa-backend#449): on the child's own,
 * or after asking AI about them in the same session. Each exercise counts
 * once, so the two add up to the star's exercises answered right.
 */
export type ChildStarAnswers = {
  unitId: string
  title: string
  independent: number
  askedAi: number
}

export type ChildLearningSummary = {
  student: {
    id: string
    name: string
    grade: string | null
  }
  questionsAskedThisWeek: number
  aiResolvedThisWeek: number
  teacherHelpRequestsThisWeek: number
  practiceLessonsCompletedThisWeek: number
  weakTopics: string[]
  recentActivity: ParentChildActivity[]
  /**
   * Stars with something answered right, in the catalogue's order. Absent from
   * a backend before stoa-backend#460.
   */
  starAnswers?: ChildStarAnswers[]
}

export type ChildLearningHistoryResponse = {
  items: ParentChildActivity[]
}
