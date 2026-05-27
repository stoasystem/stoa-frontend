import type { UserRole } from '@/types/user'

export type AppRouteRole =
  | 'public'
  | 'student'
  | 'parent'
  | 'tutor'
  | 'admin'
  | 'organization'
  | 'shared'

export type AppRoutePriority = 'primary' | 'secondary' | 'hidden'
export type AppRouteStatus = 'core' | 'demo' | 'placeholder' | 'duplicate' | 'deprecated'
export type AppNavIcon =
  | 'analytics'
  | 'billing'
  | 'chat'
  | 'dashboard'
  | 'history'
  | 'profile'
  | 'practice'
  | 'reports'
  | 'requests'
  | 'settings'
  | 'students'
  | 'support'
  | 'tutors'

export type AppNavItem = {
  label: string
  path: string
  role: AppRouteRole
  priority: AppRoutePriority
  status: AppRouteStatus
  icon: AppNavIcon
  mobile?: boolean
  description?: string
}

export type AppRouteMeta = {
  path: string
  pageName: string
  role: AppRouteRole
  module: string
  status: AppRouteStatus
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  navPriority: AppRoutePriority
  purpose: string
}

export const roleHomePaths: Record<Exclude<AppRouteRole, 'public' | 'shared'>, string> = {
  student: '/dashboard',
  parent: '/parent',
  tutor: '/tutor',
  admin: '/admin',
  organization: '/organization',
}

export function getRouteRoleForUserRole(role: UserRole): Exclude<AppRouteRole, 'public' | 'shared'> {
  if (role === 'organization_admin' || role === 'school_teacher' || role === 'school_viewer') {
    return 'organization'
  }

  return role
}

export const navItems: AppNavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    role: 'student',
    priority: 'primary',
    status: 'core',
    icon: 'dashboard',
    mobile: true,
    description: 'Learning overview and next action.',
  },
  {
    label: 'Practice',
    path: '/practice',
    role: 'student',
    priority: 'primary',
    status: 'core',
    icon: 'practice',
    mobile: true,
    description: 'Short guided lessons that can open a question when a step is unclear.',
  },
  {
    label: 'Ask a question',
    path: '/chat',
    role: 'student',
    priority: 'primary',
    status: 'core',
    icon: 'chat',
    mobile: true,
    description: 'Ask a question, explain unclear steps, and request teacher help.',
  },
  {
    label: 'Learning History',
    path: '/learning-history',
    role: 'student',
    priority: 'primary',
    status: 'core',
    icon: 'history',
    description: 'Past questions and learning records.',
  },
  {
    label: 'Profile',
    path: '/profile',
    role: 'student',
    priority: 'primary',
    status: 'core',
    icon: 'profile',
    mobile: true,
    description: 'Student account and preferences.',
  },
  {
    label: 'Overview',
    path: '/parent',
    role: 'parent',
    priority: 'primary',
    status: 'core',
    icon: 'dashboard',
    mobile: true,
    description: 'Child learning summary and parent next steps.',
  },
  {
    label: 'Reports',
    path: '/parent/reports',
    role: 'parent',
    priority: 'primary',
    status: 'core',
    icon: 'reports',
    mobile: true,
    description: 'Open weekly and monthly child reports.',
  },
  {
    label: 'Billing',
    path: '/billing',
    role: 'parent',
    priority: 'primary',
    status: 'core',
    icon: 'billing',
    mobile: true,
    description: 'Plan and billing state.',
  },
  {
    label: 'Referrals',
    path: '/referrals',
    role: 'parent',
    priority: 'secondary',
    status: 'core',
    icon: 'students',
    description: 'Invite and referral workflow.',
  },
  {
    label: 'Contact',
    path: '/contact',
    role: 'parent',
    priority: 'secondary',
    status: 'core',
    icon: 'support',
    description: 'Contact STOA when family support is needed.',
  },
  {
    label: 'Requests',
    path: '/tutor',
    role: 'tutor',
    priority: 'primary',
    status: 'core',
    icon: 'requests',
    mobile: true,
    description: 'Tutor help requests queue.',
  },
  {
    label: 'Availability',
    path: '/tutor/availability',
    role: 'tutor',
    priority: 'primary',
    status: 'core',
    icon: 'settings',
    mobile: true,
    description: 'Tutor availability and subjects.',
  },
  {
    label: 'Profile',
    path: '/tutor/profile',
    role: 'tutor',
    priority: 'primary',
    status: 'core',
    icon: 'profile',
    mobile: true,
    description: 'Tutor account, contact, credentials, and payout details.',
  },
  {
    label: 'Support',
    path: '/support',
    role: 'tutor',
    priority: 'secondary',
    status: 'core',
    icon: 'support',
    description: 'Tutor support and help.',
  },
  {
    label: 'Overview',
    path: '/admin',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'dashboard',
    mobile: true,
    description: 'Admin operations overview.',
  },
  {
    label: 'Users',
    path: '/admin/users',
    role: 'admin',
    priority: 'secondary',
    status: 'placeholder',
    icon: 'students',
    description: 'Future user management placeholder.',
  },
  {
    label: 'Learning Activity',
    path: '/admin/usage',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'analytics',
    mobile: true,
    description: 'Usage and activity summary.',
  },
  {
    label: 'Help Requests',
    path: '/admin/help-requests',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'requests',
    mobile: true,
    description: 'Teacher-help operations.',
  },
  {
    label: 'Support Inbox',
    path: '/admin/support',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'support',
    mobile: true,
    description: 'Support ticket triage.',
  },
  {
    label: 'Analytics',
    path: '/admin/analytics',
    role: 'admin',
    priority: 'secondary',
    status: 'core',
    icon: 'analytics',
    description: 'Operational analytics overview.',
  },
  {
    label: 'Advanced Analytics',
    path: '/admin/advanced-analytics',
    role: 'admin',
    priority: 'hidden',
    status: 'demo',
    icon: 'analytics',
    description: 'Phase 12 platform demo analytics.',
  },
  {
    label: 'Retention',
    path: '/admin/retention',
    role: 'admin',
    priority: 'hidden',
    status: 'demo',
    icon: 'analytics',
    description: 'Retention demo surface.',
  },
  {
    label: 'Overview',
    path: '/organization',
    role: 'organization',
    priority: 'primary',
    status: 'demo',
    icon: 'dashboard',
    mobile: true,
    description: 'Organization workspace overview.',
  },
  {
    label: 'Students',
    path: '/organization/students',
    role: 'organization',
    priority: 'primary',
    status: 'demo',
    icon: 'students',
    mobile: true,
    description: 'Organization student list.',
  },
  {
    label: 'Tutors',
    path: '/organization/tutors',
    role: 'organization',
    priority: 'primary',
    status: 'demo',
    icon: 'tutors',
    mobile: true,
    description: 'Organization tutor coverage.',
  },
  {
    label: 'Reports',
    path: '/organization/reports',
    role: 'organization',
    priority: 'primary',
    status: 'demo',
    icon: 'reports',
    description: 'Organization reporting overview.',
  },
  {
    label: 'Analytics',
    path: '/organization/analytics',
    role: 'organization',
    priority: 'secondary',
    status: 'demo',
    icon: 'analytics',
    description: 'Organization analytics demo.',
  },
  {
    label: 'Tutor Assignment',
    path: '/organization/tutor-assignment',
    role: 'organization',
    priority: 'hidden',
    status: 'demo',
    icon: 'tutors',
    description: 'Advanced tutor assignment board.',
  },
]

export const routeMetadata: AppRouteMeta[] = [
  { path: '/', pageName: 'HomePage', role: 'public', module: 'Public', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'App entry and STOA overview.' },
  { path: '/login', pageName: 'LoginPage', role: 'public', module: 'Auth', status: 'core', priority: 'P0', navPriority: 'secondary', purpose: 'User sign-in.' },
  { path: '/register', pageName: 'RegisterPage', role: 'public', module: 'Auth', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'New account registration.' },
  { path: '/forgot-password', pageName: 'ForgotPasswordPage', role: 'public', module: 'Auth', status: 'placeholder', priority: 'P2', navPriority: 'hidden', purpose: 'Future password recovery surface.' },
  { path: '/pricing', pageName: 'PricingPage', role: 'public', module: 'Billing', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Plan comparison and conversion.' },
  { path: '/qa', pageName: 'QaPage', role: 'public', module: 'Marketing', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Categorized public Q&A for students, parents, teachers, and pricing.' },
  { path: '/for-parents', pageName: 'ForParentsPage', role: 'public', module: 'Marketing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Parent acquisition page.' },
  { path: '/how-it-works', pageName: 'HowItWorksPage', role: 'public', module: 'Marketing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Product explanation.' },
  { path: '/ai-homework-help', pageName: 'HowItWorksPage', role: 'public', module: 'Marketing', status: 'duplicate', priority: 'P3', navPriority: 'hidden', purpose: 'Alias for how-it-works.' },
  { path: '/teacher-support', pageName: 'TeacherSupportPage', role: 'public', module: 'Marketing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Teacher-support explanation.' },
  { path: '/for-schools', pageName: 'ForSchoolsPage', role: 'public', module: 'Partnership', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'School partnership entry.' },
  { path: '/for-tutoring-centers', pageName: 'ForTutoringCentersPage', role: 'public', module: 'Partnership', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Tutoring center partnership entry.' },
  { path: '/partnership/onboarding', pageName: 'PartnershipOnboardingPage', role: 'public', module: 'Partnership', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Partnership interest form.' },
  { path: '/privacy', pageName: 'PrivacyPage', role: 'public', module: 'Legal', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Privacy placeholder.' },
  { path: '/terms', pageName: 'TermsPage', role: 'public', module: 'Legal', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Terms placeholder.' },
  { path: '/onboarding', pageName: 'OnboardingPage', role: 'shared', module: 'Onboarding', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Role onboarding guide.' },
  { path: '/support', pageName: 'SupportPage', role: 'shared', module: 'Support', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Support request entry.' },
  { path: '/billing', pageName: 'BillingPage', role: 'shared', module: 'Billing', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Billing and subscription overview.' },
  { path: '/billing/checkout/demo', pageName: 'VirtualCheckoutPage', role: 'shared', module: 'Billing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Virtual checkout demo.' },
  { path: '/billing/checkout/success', pageName: 'CheckoutResultPage', role: 'shared', module: 'Billing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Checkout success result.' },
  { path: '/billing/checkout/cancel', pageName: 'CheckoutResultPage', role: 'shared', module: 'Billing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Checkout cancellation result.' },
  { path: '/referrals', pageName: 'ReferralsPage', role: 'shared', module: 'Growth', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Referral invite flow.' },
  { path: '/support/tickets', pageName: 'SupportTicketsPage', role: 'shared', module: 'Support', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'User support ticket list.' },
  { path: '/support/tickets/:ticketId', pageName: 'SupportTicketDetailPage', role: 'shared', module: 'Support', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'User support ticket detail.' },
  { path: '/dashboard', pageName: 'StudentDashboardPage', role: 'student', module: 'Learning', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student learning overview.' },
  { path: '/chat', pageName: 'ChatPage', role: 'student', module: 'Learning', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student question explanation and teacher-help request flow.' },
  { path: '/practice', pageName: 'PracticeOverviewPage', role: 'student', module: 'Practice', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student subject practice overview.' },
  { path: '/practice/:subjectId/:topicId', pageName: 'SubjectPathPage', role: 'student', module: 'Practice', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Subject/topic learning path.' },
  { path: '/practice/:subjectId/:topicId/lessons/:lessonId', pageName: 'LessonPage', role: 'student', module: 'Practice', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Practice lesson challenge flow.' },
  { path: '/practice/:subjectId/:topicId/lessons/:lessonId/result', pageName: 'LessonResultPage', role: 'student', module: 'Practice', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Practice lesson result summary.' },
  { path: '/practice/:subjectId', pageName: 'SubjectPathPage', role: 'student', module: 'Practice', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Legacy subject learning path compatibility route.' },
  { path: '/practice/:subjectId/lessons/:lessonId', pageName: 'LessonPage', role: 'student', module: 'Practice', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Legacy Practice lesson route compatibility.' },
  { path: '/practice/:subjectId/lessons/:lessonId/result', pageName: 'LessonResultPage', role: 'student', module: 'Practice', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Legacy Practice lesson result route compatibility.' },
  { path: '/practice/mistakes', pageName: 'MistakesReviewPage', role: 'student', module: 'Practice', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Recent practice mistakes review.' },
  { path: '/profile', pageName: 'StudentProfilePage', role: 'student', module: 'Account', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Student profile.' },
  { path: '/learning-history', pageName: 'StudentLearningHistoryPage', role: 'student', module: 'Learning', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Student learning history.' },
  { path: '/parent', pageName: 'ParentDashboardPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Parent overview and child list.' },
  { path: '/parent/reports', pageName: 'ParentReportsPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Parent report hub for weekly and monthly child reports.' },
  { path: '/parent/children/:childId', pageName: 'ChildSummaryPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Child summary detail.' },
  { path: '/parent/children/:childId/report', pageName: 'ChildReportPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Weekly child report.' },
  { path: '/parent/children/:childId/monthly-report', pageName: 'ParentMonthlyReportPage', role: 'parent', module: 'Parent', status: 'demo', priority: 'P1', navPriority: 'hidden', purpose: 'Monthly child report demo.' },
  { path: '/parent/children/:childId/history', pageName: 'ChildLearningHistoryPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Child learning history.' },
  { path: '/tutor', pageName: 'TutorDashboardPage', role: 'tutor', module: 'Tutor', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Tutor request queue.' },
  { path: '/tutor/availability', pageName: 'TutorAvailabilityPage', role: 'tutor', module: 'Tutor', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Tutor availability.' },
  { path: '/tutor/profile', pageName: 'TutorProfilePage', role: 'tutor', module: 'Tutor', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Tutor profile, contact, verification, and payout settlement details.' },
  { path: '/tutor/requests/:requestId', pageName: 'TutorHelpRequestDetailPage', role: 'tutor', module: 'Tutor', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Tutor request detail and status update.' },
  { path: '/admin', pageName: 'AdminDashboardPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Admin operations overview.' },
  { path: '/admin/analytics', pageName: 'AdminAnalyticsPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Admin analytics overview.' },
  { path: '/admin/advanced-analytics', pageName: 'AdvancedAnalyticsPage', role: 'admin', module: 'Analytics', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Advanced analytics demo.' },
  { path: '/admin/retention', pageName: 'RetentionPage', role: 'admin', module: 'Analytics', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Retention demo.' },
  { path: '/admin/usage', pageName: 'AdminUsagePage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Admin usage summary.' },
  { path: '/admin/feedback', pageName: 'AdminFeedbackPage', role: 'admin', module: 'Admin', status: 'duplicate', priority: 'P2', navPriority: 'hidden', purpose: 'Feedback list, overlaps with support inbox.' },
  { path: '/admin/help-requests', pageName: 'AdminHelpRequestsPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Admin teacher-help request monitoring.' },
  { path: '/admin/users', pageName: 'AdminOperationsPlaceholderPage', role: 'admin', module: 'Admin', status: 'placeholder', priority: 'P3', navPriority: 'secondary', purpose: 'Future user admin placeholder.' },
  { path: '/admin/support', pageName: 'AdminSupportTicketsPage', role: 'admin', module: 'Support', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Admin support inbox.' },
  { path: '/admin/support/:ticketId', pageName: 'AdminSupportTicketDetailPage', role: 'admin', module: 'Support', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Admin support ticket detail.' },
  { path: '/admin/billing-interest', pageName: 'AdminOperationsPlaceholderPage', role: 'admin', module: 'Admin', status: 'placeholder', priority: 'P3', navPriority: 'hidden', purpose: 'Future billing interest admin placeholder.' },
  { path: '/admin/system', pageName: 'AdminOperationsPlaceholderPage', role: 'admin', module: 'Admin', status: 'placeholder', priority: 'P3', navPriority: 'hidden', purpose: 'Future system status admin placeholder.' },
  { path: '/organization', pageName: 'OrganizationDashboardPage', role: 'organization', module: 'Organization', status: 'demo', priority: 'P1', navPriority: 'primary', purpose: 'Organization demo overview.' },
  { path: '/organization/students', pageName: 'OrganizationStudentsPage', role: 'organization', module: 'Organization', status: 'demo', priority: 'P1', navPriority: 'primary', purpose: 'Organization student list.' },
  { path: '/organization/tutors', pageName: 'OrganizationTutorsPage', role: 'organization', module: 'Organization', status: 'demo', priority: 'P1', navPriority: 'primary', purpose: 'Organization tutor list.' },
  { path: '/organization/reports', pageName: 'OrganizationReportsPage', role: 'organization', module: 'Organization', status: 'demo', priority: 'P1', navPriority: 'primary', purpose: 'Organization reports overview.' },
  { path: '/organization/analytics', pageName: 'OrganizationAnalyticsPage', role: 'organization', module: 'Organization', status: 'demo', priority: 'P2', navPriority: 'secondary', purpose: 'Organization analytics demo.' },
  { path: '/organization/tutor-assignment', pageName: 'TutorAssignmentBoardPage', role: 'organization', module: 'Organization', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Advanced tutor assignment demo.' },
  { path: '/organization/students/:studentId/learning-profile', pageName: 'StudentLearningProfilePage', role: 'organization', module: 'Learning Intelligence', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Organization-scoped learning profile.' },
  { path: '/students/:studentId/learning-profile', pageName: 'StudentLearningProfilePage', role: 'organization', module: 'Learning Intelligence', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Advanced learning profile direct route.' },
  { path: '/students/:studentId/diagnosis', pageName: 'WeakPointDiagnosisPage', role: 'organization', module: 'Learning Intelligence', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Weak-point diagnosis demo.' },
  { path: '/students/:studentId/curriculum-graph', pageName: 'CurriculumGraphPage', role: 'organization', module: 'Learning Intelligence', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Student curriculum graph demo.' },
  { path: '/curriculum-graph', pageName: 'CurriculumGraphPage', role: 'organization', module: 'Learning Intelligence', status: 'duplicate', priority: 'P3', navPriority: 'hidden', purpose: 'Generic graph demo alias.' },
]
