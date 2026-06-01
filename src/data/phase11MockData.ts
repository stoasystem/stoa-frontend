import type { AdminAnalyticsOverview } from '@/types/adminAnalytics'
import type { BillingPlan, BillingUsage, FeatureAccess, Subscription } from '@/types/billing'
import type { ReferralSummary } from '@/types/referral'
import type { SupportTicket } from '@/types/supportTicket'
import type { TutorAvailability } from '@/types/tutorAvailability'
import type { ChildLearningSummary, ParentChild } from '@/types/parent'
import type { ParentWeeklyReport } from '@/types/parentReport'
import type { LearningHistoryItem } from '@/types/student'
import type { TutorHelpRequestDetail, TutorHelpRequestSummary, TutorStats } from '@/types/tutor'

export const mockBillingPlans: BillingPlan[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    priceMonthly: 0,
    currency: 'CHF',
    audience: 'Families trying STOA before choosing a plan.',
    cta: 'Start free trial',
    features: ['Guided learning questions', 'Parent dashboard', 'Basic learning history'],
  },
  {
    id: 'student',
    name: 'Student Plan',
    priceMonthly: 29,
    currency: 'CHF',
    audience: 'A student who needs consistent homework help.',
    cta: 'Select student',
    features: ['Learning space', 'Homework upload', 'Parent dashboard'],
  },
  {
    id: 'tutor_supported',
    name: 'Teacher-supported Plan',
    priceMonthly: 89,
    currency: 'CHF',
    audience: 'Families who want limited weekly teacher Q&A.',
    cta: 'Select teacher support',
    features: ['Everything in Student', 'Weekly parent report', 'Limited weekly teacher Q&A'],
  },
  {
    id: 'family',
    name: 'Family Plan',
    priceMonthly: 149,
    currency: 'CHF',
    recommended: true,
    audience: 'Families who want the highest support level and shared access.',
    cta: 'Select family',
    features: ['Everything in Teacher-supported', '5x more teacher Q&A time', 'Shared benefits for up to 3 people'],
  },
]

export const mockSubscription: Subscription = {
  status: 'trial',
  plan: 'free_trial',
  currentPeriodEnd: '2026-06-30T00:00:00Z',
}

export const mockBillingUsage: BillingUsage = {
  periodStart: '2026-06-01T00:00:00Z',
  periodEnd: '2026-06-30T00:00:00Z',
  aiMessagesUsed: 82,
  aiMessagesLimit: 500,
  fileUploadsUsed: 12,
  fileUploadsLimit: 100,
  teacherHelpUsed: 4,
  teacherHelpLimit: 4,
}

export const mockFeatureAccess: FeatureAccess = {
  canUseChat: true,
  canUploadFiles: true,
  canRequestTeacherHelp: true,
  canViewParentReports: true,
  reason: {},
}

export const mockReferralSummary: ReferralSummary = {
  code: 'KELLER2026',
  inviteUrl: 'https://app.stoa.example/register?ref=KELLER2026',
  successfulInvites: 2,
}

export const mockTutorAvailability: TutorAvailability = {
  weeklyAvailability: [
    { dayOfWeek: 'monday', startTime: '16:00', endTime: '18:00' },
    { dayOfWeek: 'wednesday', startTime: '17:00', endTime: '19:00' },
  ],
  subjects: ['Mathematics', 'Physics'],
}

export const mockSupportTickets: SupportTicket[] = [
  {
    id: 'ticket-101',
    subject: 'Parent report did not refresh',
    message: 'The weekly report still shows last week for my child.',
    status: 'in_review',
    priority: 'normal',
    category: 'parent_report',
    createdAt: '2026-05-22T10:20:00Z',
    updatedAt: '2026-05-23T08:15:00Z',
    requesterEmail: 'parent@example.com',
  },
  {
    id: 'ticket-102',
    subject: 'Question upload failed on mobile',
    message: 'The image upload stopped after selecting a homework photo.',
    status: 'open',
    priority: 'high',
    category: 'file_upload',
    createdAt: '2026-05-24T14:10:00Z',
    updatedAt: '2026-05-24T14:10:00Z',
    requesterEmail: 'student@example.com',
  },
]

export const mockAdminAnalyticsOverview: AdminAnalyticsOverview = {
  activeUsers: 42,
  weeklyActiveStudents: 18,
  newRegistrations: 12,
  messagesSent: 842,
  filesUploaded: 96,
  teacherHelpRequests: 37,
  parentReportViews: 58,
  checkoutStarted: 9,
  checkoutCompleted: 4,
  cancelledSubscriptions: 1,
}

export const mockParentChildren: ParentChild[] = [
  {
    id: 'user-student',
    name: 'Anna Keller',
    grade: 'Grade 8',
    primarySubjects: ['Mathematics', 'Physics'],
  },
]

export const mockChildLearningSummary: ChildLearningSummary = {
  student: { id: 'user-student', name: 'Anna Keller', grade: 'Grade 8' },
  stats: [
    { label: 'Questions asked', value: '24', description: 'This week' },
    { label: 'Teacher help', value: '3', description: 'Resolved requests' },
    { label: 'Study streak', value: '5 days', description: 'Active learning' },
  ],
  weakTopics: [
    { id: 'topic-1', subject: 'Mathematics', topic: 'Quadratic equations', level: 'medium' },
    { id: 'topic-2', subject: 'Physics', topic: 'Forces and motion', level: 'high' },
  ],
  recentQuestions: [
    {
      id: 'question-1',
      subject: 'Mathematics',
      title: 'How do I solve x squared equals 9?',
      createdAt: '2026-05-24T10:00:00Z',
      status: 'answered_by_ai',
    },
  ],
  teacherHelpRecords: [
    { id: 'help-1', subject: 'Mathematics', status: 'resolved', createdAt: '2026-05-24T11:00:00Z' },
  ],
}

export const mockChildLearningHistory: LearningHistoryItem[] = [
  {
    id: 'history-1',
    subject: 'Mathematics',
    title: 'Quadratic equations',
    summary: 'Solved x squared equals 9 and reviewed positive and negative roots.',
    createdAt: '2026-05-24T10:00:00Z',
  },
]

export const mockParentWeeklyReport: ParentWeeklyReport = {
  id: 'report-1',
  student: { id: 'user-student', name: 'Anna Keller', grade: 'Grade 8' },
  period: { label: 'Week of May 18', startDate: '2026-05-18', endDate: '2026-05-24' },
  summary: 'Anna practiced consistently and needed teacher help once for quadratic equations.',
  stats: [
    { label: 'Questions', value: '24', description: 'Answered this week' },
    { label: 'Teacher help', value: '1', description: 'Resolved request' },
  ],
  topSubjects: [
    {
      id: 'subject-1',
      name: 'Mathematics',
      questionsAnswered: 14,
      teacherHelpCount: 1,
      progressLabel: 'Improving',
      summary: 'Good engagement with algebra practice.',
    },
  ],
  weakTopics: [
    {
      id: 'weak-1',
      subject: 'Mathematics',
      topic: 'Quadratic equations',
      level: 'medium',
      summary: 'Needs more practice identifying square roots and solution pairs.',
    },
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: 'Review square roots',
      description: 'Spend 15 minutes on equations such as x squared equals 9.',
      priority: 'medium',
    },
  ],
  generatedAt: '2026-05-24T18:00:00Z',
}

export const mockTutorHelpRequests: TutorHelpRequestSummary[] = [
  {
    requestId: 'help-1',
    conversationId: 'conv-1',
    studentName: 'Anna Keller',
    subject: 'Mathematics',
    grade: 'Grade 8',
    status: 'pending',
    priority: 'high',
    requestMessage: 'Student needs help checking the solution steps.',
    createdAt: '2026-05-24T11:00:00Z',
  },
]

export const mockTutorHelpRequestDetail: TutorHelpRequestDetail = {
  requestId: 'help-1',
  conversationId: 'conv-1',
  student: { id: 'user-student', name: 'Anna Keller', grade: 'Grade 8' },
  subject: 'Mathematics',
  status: 'pending',
  requestMessage: 'The student requested support after practising this step.',
  practiceContext: {
    source: 'practice',
    subjectId: 'mathematics',
    gradeLevel: 'lower_secondary',
    topicId: 'equations',
    unitId: 'unit-linear-equations',
    lessonId: 'lesson-linear-2',
    challengeId: 'linear-2-c2',
    challengePrompt: 'Solve 3x + 5 = 20. Write the value of x.',
    topic: 'Solving equations in two steps',
    studentAnswer: '6',
    correctAnswer: '5',
    attempts: 2,
    hintViewed: true,
    learningChatExplanationRequested: true,
  },
  messages: [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'student',
      content: 'I tried 3x + 5 = 20 and got x = 6. What did I miss?',
      createdAt: '2026-05-24T10:00:00Z',
      status: 'sent',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'First remove the +5 from both sides: 3x = 15. Then divide by 3, so x = 5.',
      createdAt: '2026-05-24T10:00:10Z',
      status: 'sent',
    },
  ],
  notes: [],
}

export const mockTutorStats: TutorStats = {
  pendingRequests: 1,
  resolvedToday: 3,
  averageResponseTimeMinutes: 12,
}
