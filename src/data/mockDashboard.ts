import type {
  DashboardStat,
  LearningProgress,
  RecentQuestion,
  TeacherFeedback,
  WeakTopic,
} from '@/types/dashboard'

export const dashboardStats: DashboardStat[] = [
  {
    label: 'Questions Asked',
    value: '24',
    description: 'This week',
  },
  {
    label: 'Teacher Help Sessions',
    value: '3',
    description: 'This week',
  },
  {
    label: 'Learning Streak',
    value: '5 days',
    description: 'Active study days',
  },
]

export const weakTopics: WeakTopic[] = [
  {
    id: 'topic-1',
    subject: 'Mathematics',
    topic: 'Quadratic equations',
    level: 'medium',
  },
  {
    id: 'topic-2',
    subject: 'Physics',
    topic: 'Forces and motion',
    level: 'high',
  },
  {
    id: 'topic-3',
    subject: 'English',
    topic: 'Argument structure',
    level: 'low',
  },
]

export const recentQuestions: RecentQuestion[] = [
  {
    id: 'question-1',
    subject: 'Mathematics',
    title: 'How do I factor quadratic equations?',
    createdAt: '2026-05-24T10:00:00Z',
    status: 'answered_by_ai',
  },
  {
    id: 'question-2',
    subject: 'Physics',
    title: 'Why does acceleration depend on force?',
    createdAt: '2026-05-23T16:20:00Z',
    status: 'teacher_helped',
  },
  {
    id: 'question-3',
    subject: 'English',
    title: 'How can I improve my essay thesis?',
    createdAt: '2026-05-22T13:45:00Z',
    status: 'pending',
  },
]

export const learningProgress: LearningProgress[] = [
  {
    id: 'progress-1',
    subject: 'Mathematics',
    completed: 68,
    target: 100,
    description: 'Algebra practice target',
  },
  {
    id: 'progress-2',
    subject: 'Physics',
    completed: 42,
    target: 100,
    description: 'Forces and motion review',
  },
  {
    id: 'progress-3',
    subject: 'English',
    completed: 76,
    target: 100,
    description: 'Writing feedback cycle',
  },
]

export const teacherFeedback: TeacherFeedback[] = [
  {
    id: 'feedback-1',
    teacherName: 'Ms. Keller',
    content:
      'Good progress in algebra. The next step is to practice word problems more carefully.',
    createdAt: '2026-05-22T09:30:00Z',
  },
]
