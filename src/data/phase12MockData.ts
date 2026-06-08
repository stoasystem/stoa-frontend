import type { AdvancedAnalyticsOverview, RetentionOverview } from '@/types/advancedAnalytics'
import type { CurriculumGraph } from '@/types/curriculumGraph'
import type { LearningDiagnosis } from '@/types/diagnosis'
import type { LearningProfile } from '@/types/learningProfile'
import type {
  Organization,
  OrganizationReportOverview,
  OrganizationStudent,
  OrganizationSummary,
  OrganizationTutor,
} from '@/types/organization'
import type { ParentMonthlyReport } from '@/types/parentMonthlyReport'
import type { TutorAssignmentBoard } from '@/types/tutorAssignment'

export const mockOrganizations: Organization[] = [
  {
    id: 'org-zurich-center',
    name: 'STOA Zurich Tutoring Center',
    type: 'tutoring_center',
    location: 'Zurich',
    studentCount: 42,
    tutorCount: 8,
  },
  {
    id: 'org-limmat-school',
    name: 'Limmat Secondary School',
    type: 'school',
    location: 'Zurich',
    studentCount: 118,
    tutorCount: 14,
  },
]

export const mockOrganizationSummaries: Record<string, OrganizationSummary> = {
  'org-zurich-center': {
    activeStudents: 28,
    totalStudents: 42,
    totalTutors: 8,
    questionsAskedThisWeek: 326,
    teacherHelpRequestsThisWeek: 41,
    parentReportViewsThisWeek: 67,
    weakTopics: [
      { id: 'weak-quadratics', subject: 'Mathematics', topic: 'Quadratic word problems', affectedStudents: 12 },
      { id: 'weak-forces', subject: 'Physics', topic: 'Forces and motion', affectedStudents: 8 },
      { id: 'weak-functions', subject: 'Mathematics', topic: 'Functions and graphs', affectedStudents: 7 },
    ],
    tutorWorkload: [
      { tutorId: 'tutor-1', name: 'Mira Vogel', pendingRequests: 5, resolvedThisWeek: 18 },
      { tutorId: 'tutor-2', name: 'Noah Meier', pendingRequests: 3, resolvedThisWeek: 14 },
      { tutorId: 'tutor-3', name: 'Lea Baumann', pendingRequests: 2, resolvedThisWeek: 11 },
    ],
  },
  'org-limmat-school': {
    activeStudents: 86,
    totalStudents: 118,
    totalTutors: 14,
    questionsAskedThisWeek: 904,
    teacherHelpRequestsThisWeek: 73,
    parentReportViewsThisWeek: 139,
    weakTopics: [
      { id: 'weak-fractions', subject: 'Mathematics', topic: 'Fractions and ratios', affectedStudents: 24 },
      { id: 'weak-energy', subject: 'Physics', topic: 'Energy conservation', affectedStudents: 17 },
      { id: 'weak-geometry', subject: 'Mathematics', topic: 'Similarity and scale', affectedStudents: 15 },
    ],
    tutorWorkload: [
      { tutorId: 'tutor-4', name: 'Jonas Frei', pendingRequests: 7, resolvedThisWeek: 21 },
      { tutorId: 'tutor-5', name: 'Sofia Steiner', pendingRequests: 4, resolvedThisWeek: 19 },
      { tutorId: 'tutor-6', name: 'Elena Roth', pendingRequests: 4, resolvedThisWeek: 16 },
    ],
  },
}

export const mockOrganizationStudents: Record<string, OrganizationStudent[]> = {
  'org-zurich-center': [
    {
      id: 'student-anna',
      name: 'Anna Keller',
      grade: 'Grade 8',
      primarySubjects: ['Mathematics', 'Physics'],
      lastActiveAt: '2026-06-12T16:30:00Z',
      weakTopicCount: 4,
      teacherHelpCount: 3,
    },
    {
      id: 'student-luca',
      name: 'Luca Meier',
      grade: 'Grade 9',
      primarySubjects: ['Mathematics'],
      lastActiveAt: '2026-06-12T14:10:00Z',
      weakTopicCount: 2,
      teacherHelpCount: 1,
    },
    {
      id: 'student-sara',
      name: 'Sara Baumann',
      grade: 'Grade 8',
      primarySubjects: ['Physics', 'Chemistry'],
      lastActiveAt: '2026-06-11T18:45:00Z',
      weakTopicCount: 3,
      teacherHelpCount: 2,
    },
  ],
  'org-limmat-school': [
    {
      id: 'student-anna',
      name: 'Anna Keller',
      grade: 'Grade 8',
      primarySubjects: ['Mathematics', 'Physics'],
      lastActiveAt: '2026-06-12T16:30:00Z',
      weakTopicCount: 4,
      teacherHelpCount: 3,
    },
    {
      id: 'student-milo',
      name: 'Milo Schmid',
      grade: 'Grade 7',
      primarySubjects: ['Mathematics'],
      lastActiveAt: '2026-06-10T12:30:00Z',
      weakTopicCount: 5,
      teacherHelpCount: 4,
    },
  ],
}

export const mockOrganizationTutors: Record<string, OrganizationTutor[]> = {
  'org-zurich-center': [
    {
      id: 'tutor-1',
      name: 'Mira Vogel',
      subjects: ['Mathematics', 'Physics'],
      availability: 'Mon/Wed 16:00-19:00',
      pendingRequests: 5,
      resolvedRequests: 18,
      averageResponseTimeMinutes: 13,
    },
    {
      id: 'tutor-2',
      name: 'Noah Meier',
      subjects: ['Mathematics'],
      availability: 'Tue/Thu 17:00-20:00',
      pendingRequests: 3,
      resolvedRequests: 14,
      averageResponseTimeMinutes: 16,
    },
  ],
  'org-limmat-school': [
    {
      id: 'tutor-4',
      name: 'Jonas Frei',
      subjects: ['Mathematics', 'Chemistry'],
      availability: 'Weekdays 15:00-18:00',
      pendingRequests: 7,
      resolvedRequests: 21,
      averageResponseTimeMinutes: 11,
    },
    {
      id: 'tutor-5',
      name: 'Sofia Steiner',
      subjects: ['Physics'],
      availability: 'Mon/Fri 16:00-18:30',
      pendingRequests: 4,
      resolvedRequests: 19,
      averageResponseTimeMinutes: 14,
    },
  ],
}

export const mockOrganizationReports: OrganizationReportOverview = {
  weeklyReportsSent: 36,
  monthlyReportsReady: 19,
  parentViewsThisWeek: 67,
  reportHighlights: [
    'Mathematics engagement increased after teacher follow-up.',
    'Parents opened reports most often on Sunday evening.',
    'Monthly report preview is ready for high-engagement families.',
  ],
}

export const mockLearningProfile: LearningProfile = {
  studentId: 'student-anna',
  subjects: [
    { id: 'math', label: 'Mathematics', rolloutState: 'active' },
    { id: 'physics', label: 'Physics', rolloutState: 'foundation' },
    { id: 'german', label: 'German', rolloutState: 'foundation' },
    { id: 'english', label: 'English', rolloutState: 'foundation' },
  ],
  subjectActivity: [
    {
      subject: 'math',
      label: 'Mathematics',
      rolloutState: 'active',
      questionCount: 12,
      aiResolvedCount: 10,
      teacherEscalationCount: 2,
      feedbackAverage: 4.3,
    },
    {
      subject: 'physics',
      label: 'Physics',
      rolloutState: 'foundation',
      questionCount: 4,
      aiResolvedCount: 3,
      teacherEscalationCount: 1,
      feedbackAverage: 3.8,
    },
  ],
  weakTopics: [
    {
      subject: 'math',
      topicId: 'quadratic-word-problems',
      label: 'Quadratic word problems',
      count: 6,
      latestEvidenceAt: '2026-06-10T15:00:00Z',
      evidenceQuestionIds: ['question-1', 'question-2'],
    },
    {
      subject: 'physics',
      topicId: 'forces-and-motion',
      label: 'Forces and motion',
      count: 4,
      latestEvidenceAt: '2026-06-09T17:10:00Z',
      evidenceQuestionIds: ['question-3'],
    },
  ],
  strengthTopics: [],
  updatedAt: '2026-06-10T16:20:00Z',
}

export const mockLearningDiagnosis: LearningDiagnosis = {
  studentId: 'student-anna',
  generatedAt: '2026-06-12T18:00:00Z',
  summary: 'Anna is progressing well in algebra but still struggles with applying quadratic equations to word problems.',
  weakPoints: [
    {
      id: 'weak-1',
      subject: 'Mathematics',
      topic: 'Quadratic word problems',
      severity: 'high',
      evidence: [
        'Asked 4 related questions this week',
        'Requested teacher help once',
        'Uploaded two worksheets on the same topic',
      ],
      recommendation: 'Practice translating word problems into equations before solving.',
    },
    {
      id: 'weak-2',
      subject: 'Physics',
      topic: 'Force diagrams',
      severity: 'medium',
      evidence: ['Mixed up friction and applied force in two explanations'],
      recommendation: 'Draw force arrows before choosing equations.',
    },
  ],
  nextSteps: [
    'Review example word problems.',
    'Try 5 guided practice questions.',
    'Ask a tutor if the same mistake repeats.',
  ],
  teacherHelpRecommendation: 'Teacher help is recommended if Anna misses the setup step twice more this week.',
  parentExplanation: 'The pattern is specific and fixable: Anna usually understands the algebra after the equation is set up.',
}

export const mockCurriculumGraph: CurriculumGraph = {
  nodes: [
    {
      id: 'linear-equations',
      label: 'Linear Equations',
      subject: 'Mathematics',
      status: 'strong',
      x: 8,
      y: 38,
      detail: 'Stable foundation for solving algebraic equations.',
      recentQuestions: ['Solve 2x + 5 = 17', 'Check steps for linear equation'],
      recommendations: ['Use as prerequisite for quadratic practice.'],
    },
    {
      id: 'factoring',
      label: 'Factoring',
      subject: 'Mathematics',
      status: 'stable',
      x: 36,
      y: 18,
      detail: 'Mostly stable, with occasional sign errors.',
      recentQuestions: ['Factor x^2 + 5x + 6'],
      recommendations: ['Practice sign checks before quadratic applications.'],
    },
    {
      id: 'quadratic-equations',
      label: 'Quadratic Equations',
      subject: 'Mathematics',
      status: 'developing',
      x: 62,
      y: 38,
      detail: 'Concept is developing, especially solution pair interpretation.',
      recentQuestions: ['Solve x^2 = 9', 'Use factoring to solve a quadratic'],
      recommendations: ['Pair factoring review with visual solution checks.'],
    },
    {
      id: 'quadratic-word-problems',
      label: 'Quadratic Word Problems',
      subject: 'Mathematics',
      status: 'weak',
      x: 84,
      y: 66,
      detail: 'Main weak point: translating text into equations.',
      recentQuestions: ['Set up area word problem', 'Choose equation from story prompt'],
      recommendations: ['Identify variables first, then write the relationship.'],
    },
  ],
  edges: [
    { id: 'edge-1', source: 'linear-equations', target: 'factoring', relation: 'prerequisite' },
    { id: 'edge-2', source: 'factoring', target: 'quadratic-equations', relation: 'prerequisite' },
    { id: 'edge-3', source: 'quadratic-equations', target: 'quadratic-word-problems', relation: 'prerequisite' },
  ],
}

export const mockTutorAssignmentBoard: TutorAssignmentBoard = {
  pendingRequests: [
    {
      requestId: 'help-1',
      studentName: 'Anna Keller',
      subject: 'Mathematics',
      grade: 'Grade 8',
      createdAt: '2026-06-12T15:40:00Z',
      priority: 'high',
    },
    {
      requestId: 'help-2',
      studentName: 'Luca Meier',
      subject: 'Physics',
      grade: 'Grade 9',
      createdAt: '2026-06-12T16:05:00Z',
      priority: 'normal',
    },
  ],
  availableTutors: [
    { tutorId: 'tutor-1', name: 'Mira Vogel', subjects: ['Mathematics', 'Physics'], currentLoad: 5, isAvailableNow: true },
    { tutorId: 'tutor-2', name: 'Noah Meier', subjects: ['Mathematics'], currentLoad: 3, isAvailableNow: false },
  ],
  suggestions: [
    {
      requestId: 'help-1',
      tutorId: 'tutor-1',
      reason: 'Subject match, available now, and prior context with this student.',
    },
  ],
  scheduleOverview: [
    { tutorId: 'tutor-1', tutorName: 'Mira Vogel', dayLabel: 'Today', timeRange: '16:00-19:00', subjects: ['Mathematics', 'Physics'] },
    { tutorId: 'tutor-2', tutorName: 'Noah Meier', dayLabel: 'Tomorrow', timeRange: '17:00-20:00', subjects: ['Mathematics'] },
  ],
}

export const mockParentMonthlyReport: ParentMonthlyReport = {
  id: 'monthly-report-1',
  student: { id: 'student-anna', name: 'Anna Keller', grade: 'Grade 8' },
  monthLabel: 'June 2026',
  summary: 'Anna used STOA consistently this month, with the strongest progress in linear equations and a clear remaining gap in quadratic word problems.',
  subjectBreakdown: [
    {
      subject: 'Mathematics',
      questionsAnswered: 68,
      teacherHelpRequests: 3,
      progressLabel: 'Improving',
      summary: 'Good practice rhythm and better step-by-step explanations.',
    },
    {
      subject: 'Physics',
      questionsAnswered: 21,
      teacherHelpRequests: 1,
      progressLabel: 'Needs steady practice',
      summary: 'Force diagrams need more consistent setup before equations.',
    },
  ],
  weakPointTrend: [
    {
      topic: 'Quadratic word problems',
      subject: 'Mathematics',
      trend: 'needs_attention',
      summary: 'Still the most repeated source of teacher help.',
    },
    {
      topic: 'Linear equations',
      subject: 'Mathematics',
      trend: 'improving',
      summary: 'Moved from developing to strong across recent practice.',
    },
  ],
  teacherHelpSummary: '4 teacher-help requests were opened and all were resolved with short notes.',
  recommendations: [
    'Keep two short algebra practice sessions per week.',
    'Use tutor support for word-problem setup until the pattern is stable.',
  ],
  suggestedParentActions: [
    'Ask Anna to explain how she identifies the unknown in a word problem.',
    'Review the monthly weak-point trend before the next tutor session.',
  ],
  generatedAt: '2026-06-12T18:00:00Z',
}

export const mockAdvancedAnalytics: AdvancedAnalyticsOverview = {
  weeklyActiveStudents: 86,
  weeklyActiveParents: 41,
  questionsBySubject: [
    { subject: 'Mathematics', count: 612 },
    { subject: 'Physics', count: 188 },
    { subject: 'Chemistry', count: 104 },
  ],
  teacherHelpRequestRate: 0.18,
  fileUploadRate: 0.31,
  parentReportViewRate: 0.57,
  conversionFunnel: [
    { label: 'Parent landing', count: 220 },
    { label: 'Pricing viewed', count: 91 },
    { label: 'Checkout started', count: 18 },
    { label: 'Plan selection completed', count: 7 },
  ],
  retentionCohorts: [
    { cohort: 'May pilot', week1: 92, week4: 71, week8: 58 },
    { cohort: 'June families', week1: 88, week4: 69, week8: 0 },
  ],
  churnRiskStudents: [
    {
      id: 'student-milo',
      name: 'Milo Schmid',
      riskReason: 'No activity in 9 days after high teacher-help usage.',
      suggestedAction: 'Send parent follow-up and offer tutor check-in.',
    },
  ],
}

export const mockRetentionOverview: RetentionOverview = {
  inactiveStudents: [
    {
      id: 'student-milo',
      name: 'Milo Schmid',
      lastActiveAt: '2026-06-03T10:00:00Z',
      riskReason: 'No questions after repeated homework upload errors.',
      suggestedAction: 'Ask support to confirm upload flow and invite the parent back.',
    },
  ],
  atRiskFamilies: [
    {
      id: 'family-keller',
      familyName: 'Keller family',
      riskReason: 'High report views but no pricing click after pilot end.',
      suggestedAction: 'Send a human follow-up with the monthly report summary.',
    },
  ],
}
