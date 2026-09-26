import type { UserRole } from '@/types/user'

export type AppRouteRole =
  | 'public'
  | 'student'
  | 'parent'
  | 'teacher'
  | 'admin'
  | 'organization'
  | 'shared'

export type AppRoutePriority = 'primary' | 'secondary' | 'hidden'
export type AppRouteStatus = 'core' | 'demo' | 'placeholder' | 'duplicate' | 'deprecated'
export type AppNavIcon =
  | 'analytics'
  | 'billing'
  | 'chat'
  | 'classroom'
  | 'dashboard'
  | 'history'
  | 'profile'
  | 'practice'
  | 'questionBank'
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
  teacher: '/tutor',
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
    label: 'Learn',
    path: '/learn',
    role: 'student',
    priority: 'primary',
    status: 'core',
    icon: 'questionBank',
    mobile: true,
    description: 'Exercises, the guided path, and your mistakes.',
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
  // Card 007: payments and billing are frozen; the parent billing entry is
  // withdrawn from navigation. Kept here so the unfreeze is a revert, not a
  // rewrite. See `stoa-backend/src/stoa/routers/billing.py`.
  /*
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
  */
  {
    label: 'Requests',
    path: '/tutor',
    role: 'teacher',
    priority: 'primary',
    status: 'core',
    icon: 'requests',
    mobile: true,
    description: 'Tutor help requests queue.',
  },
  /* Card 020: withdrawn until the classroom has a backend.
  {
    label: 'Classroom Queue',
    path: '/tutor/classroom',
    role: 'teacher',
    priority: 'primary',
    status: 'core',
    icon: 'classroom',
    mobile: true,
    description: 'Scheduled classrooms and instant live support requests.',
  },
  */
  {
    label: 'Availability',
    path: '/tutor/availability',
    role: 'teacher',
    priority: 'primary',
    status: 'core',
    icon: 'settings',
    mobile: true,
    description: 'Tutor availability and subjects.',
  },
  {
    label: 'Profile',
    path: '/tutor/profile',
    role: 'teacher',
    priority: 'primary',
    status: 'core',
    icon: 'profile',
    mobile: true,
    description: 'Tutor account, contact, credentials, and payout details.',
  },
  {
    label: 'Support',
    path: '/support',
    role: 'teacher',
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
    label: 'Accounts',
    path: '/admin/users',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'students',
    description: 'Invite, assign, reset, suspend and archive accounts.',
  },
  {
    label: 'Moderation',
    path: '/admin/moderation',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'support',
    mobile: true,
    description: 'Reported learning content and internal moderation actions.',
  },
  {
    label: 'Curriculum',
    path: '/admin/curriculum',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'practice',
    description: 'Curriculum authoring, review, migration, and evidence console.',
  },
  // Card 007: frozen.
  /*
  {
    label: 'Subscriptions',
    path: '/admin/subscriptions',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'billing',
    description: 'Manual subscription request queue and tier application.',
  },
  */
  {
    label: 'Teacher applications',
    path: '/admin/teacher-applications',
    role: 'admin',
    priority: 'primary',
    status: 'core',
    icon: 'tutors',
    description: 'Review teacher applications and send activation invitations.',
  },
  // Card 039: these eight led to pages that ca9a045 deleted because their
  // backend never existed (the organization console, the tutor assignment
  // board, advanced analytics, retention). Hidden and demo, so production never
  // showed them, but switching demo surfaces on turned each into a NotFoundPage
  // link. Withdrawn, not deleted: the organization group is kept but must not
  // appear in the frontend. The pages come back from `ca9a045^` together with
  // their routes, and a backend to call.
  /*
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
  */
]

export const routeMetadata: AppRouteMeta[] = [
  { path: '/', pageName: 'EntryPage', role: 'public', module: 'Public', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'App entry and STOA overview.' },
  { path: '/login', pageName: 'LoginPage', role: 'public', module: 'Auth', status: 'core', priority: 'P0', navPriority: 'secondary', purpose: 'User sign-in.' },
  { path: '/register', pageName: 'RegisterPage', role: 'public', module: 'Auth', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Accounts are issued by an administrator; this page explains how to ask for one.' },
  { path: '/settings/password', pageName: 'ChangePasswordPage', role: 'shared', module: 'Auth', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Self-service password change: current password, emailed code, new password. Reached from the account menu (UserMenu), not from role navigation: navItems is filtered by exact role and has no shared bucket.' },
  { path: '/privacy', pageName: 'PrivacyPage', role: 'public', module: 'Legal', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Privacy placeholder.' },
  { path: '/terms', pageName: 'TermsPage', role: 'public', module: 'Legal', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Terms placeholder.' },
  { path: '/onboarding', pageName: 'OnboardingPage', role: 'shared', module: 'Onboarding', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Role onboarding guide.' },
  { path: '/support', pageName: 'SupportPage', role: 'shared', module: 'Support', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Support request entry.' },
  // Card 007 (frozen): { path: '/billing', pageName: 'BillingPage', role: 'shared', module: 'Billing', status: 'core', priority: 'P1', navPriority: 'secondary', purpose: 'Billing and subscription overview.' },
  // Card 007 (frozen): { path: '/billing/payment-settings', pageName: 'PaymentSettingsPage', role: 'shared', module: 'Billing', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Payment method, billing contact, invoice, and subscription settings.' },
  // Card 007 (frozen): { path: '/billing/checkout/demo', pageName: 'VirtualCheckoutPage', role: 'shared', module: 'Billing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Virtual checkout demo.' },
  // Card 007 (frozen): { path: '/billing/checkout/success', pageName: 'CheckoutResultPage', role: 'shared', module: 'Billing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Checkout success result.' },
  // Card 007 (frozen): { path: '/billing/checkout/cancel', pageName: 'CheckoutResultPage', role: 'shared', module: 'Billing', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Checkout cancellation result.' },
  { path: '/dashboard', pageName: 'StudentDashboardPage', role: 'student', module: 'Learning', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student learning overview.' },
  { path: '/chat', pageName: 'ChatPage', role: 'student', module: 'Learning', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student question explanation and teacher-help request flow.' },
  { path: '/learn', pageName: 'LearnPage', role: 'student', module: 'Learning', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'One place to practise: exercises, the guided path and mistakes as tabs.' },
  { path: '/learn/:tab', pageName: 'LearnPage', role: 'student', module: 'Learning', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'A tab of the learn page at its own address; the old practice and question-bank entries redirect here.' },
  { path: '/assignments', pageName: 'StudentAssignmentsPage', role: 'student', module: 'Learning', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Practice assignments set for the student.' },
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/classroom', pageName: 'StudentClassroomHomePage', role: 'student', module: 'Online Classroom', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student live classroom overview and scheduling entry.' },
  */
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/classroom/schedule', pageName: 'ScheduleClassroomPage', role: 'student', module: 'Online Classroom', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Schedule a live classroom session.' },
  */
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/classroom/sessions/:sessionId/lobby', pageName: 'ClassroomLobbyPage', role: 'student', module: 'Online Classroom', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Student classroom lobby and device check.' },
  */
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/classroom/sessions/:sessionId/room', pageName: 'ClassroomRoomPage', role: 'student', module: 'Online Classroom', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Student live classroom room.' },
  */
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/classroom/sessions/:sessionId/summary', pageName: 'ClassroomSummaryPage', role: 'student', module: 'Online Classroom', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Student classroom summary and next steps.' },
  */
  { path: '/practice', pageName: 'PracticeOverviewPage', role: 'student', module: 'Practice', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student subject practice overview.' },
  { path: '/question-bank', pageName: 'QuestionBankHomePage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Student open practice library overview.' },
  { path: '/question-bank/:subjectId', pageName: 'SubjectQuestionBankPage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Subject-level question-bank overview.' },
  { path: '/question-bank/:subjectId/:topicId', pageName: 'TopicQuestionBankPage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Topic question-set listing with filters.' },
  { path: '/question-bank/sets/:setId', pageName: 'QuestionSetOverviewPage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Question set metadata and start/resume actions.' },
  { path: '/question-bank/session/:sessionId', pageName: 'QuestionSessionPage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Question-bank answer session.' },
  { path: '/question-bank/session/:sessionId/result', pageName: 'QuestionSetResultPage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Question set result and next steps.' },
  { path: '/question-bank/mistakes', pageName: 'QuestionBankMistakesReviewPage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Question-bank mistakes review.' },
  { path: '/question-bank/saved', pageName: 'SavedQuestionSetsPage', role: 'student', module: 'Question Bank', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Saved question-bank sets.' },
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
  { path: '/parent/account-operations', pageName: 'ParentAccountOperationsPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Parent account facts: verification and linked children. Reached from the dashboard summary card.' },
  { path: '/parent/children/:childId', pageName: 'ChildSummaryPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Child summary detail.' },
  { path: '/parent/children/:childId/progress', pageName: 'ParentChildProgressPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Child practice progress.' },
  { path: '/parent/children/:childId/report', pageName: 'ChildReportPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Weekly child report.' },
  { path: '/parent/children/:childId/history', pageName: 'ChildLearningHistoryPage', role: 'parent', module: 'Parent', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Child learning history.' },
  { path: '/tutor', pageName: 'TutorDashboardPage', role: 'teacher', module: 'Tutor', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Tutor request queue.' },
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/tutor/classroom', pageName: 'TutorClassroomQueuePage', role: 'teacher', module: 'Online Classroom', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Tutor classroom queue and instant live support requests.' },
  */
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/tutor/classroom/sessions/:sessionId/lobby', pageName: 'ClassroomLobbyPage', role: 'teacher', module: 'Online Classroom', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Tutor classroom lobby and session context.' },
  */
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/tutor/classroom/sessions/:sessionId/room', pageName: 'ClassroomRoomPage', role: 'teacher', module: 'Online Classroom', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Tutor live classroom room.' },
  */
  /* Card 020: withdrawn until the classroom has a backend.
  { path: '/tutor/classroom/sessions/:sessionId/summary', pageName: 'ClassroomSummaryPage', role: 'teacher', module: 'Online Classroom', status: 'core', priority: 'P1', navPriority: 'hidden', purpose: 'Tutor classroom summary and notes.' },
  */
  { path: '/tutor/availability', pageName: 'TutorAvailabilityPage', role: 'teacher', module: 'Tutor', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Tutor availability.' },
  { path: '/tutor/profile', pageName: 'TutorProfilePage', role: 'teacher', module: 'Tutor', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Tutor profile, contact, verification, and payout settlement details.' },
  { path: '/tutor/learning-automation', pageName: 'LearningAutomationConsolePage', role: 'teacher', module: 'Learning Operations', status: 'core', priority: 'P2', navPriority: 'hidden', purpose: 'Preview and approve practice assignment batches for a student.' },
  { path: '/tutor/requests/:requestId', pageName: 'TutorHelpRequestDetailPage', role: 'teacher', module: 'Tutor', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Tutor request detail and status update.' },
  { path: '/admin', pageName: 'AdminDashboardPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P0', navPriority: 'primary', purpose: 'Admin operations overview.' },
  { path: '/admin/users', pageName: 'AdminAccountsPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Account console: invite, assign, reset password, suspend and archive.' },
  { path: '/admin/curriculum', pageName: 'AdminCurriculumPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Curriculum editor, review, migration, and evidence console.' },
  { path: '/admin/moderation', pageName: 'AdminModerationPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Reported learning content and internal moderation actions.' },
  { path: '/admin/account-operations', pageName: 'AdminAccountOperationsPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P2', navPriority: 'hidden', purpose: 'Parent support console, reached from the admin overview.' },
  { path: '/admin/learning-operations', pageName: 'LearningOperationsDashboardPage', role: 'admin', module: 'Learning Operations', status: 'core', priority: 'P2', navPriority: 'hidden', purpose: 'Curriculum analytics and warehouse export readiness.' },
  { path: '/admin/learning-automation', pageName: 'LearningAutomationConsolePage', role: 'admin', module: 'Learning Operations', status: 'core', priority: 'P2', navPriority: 'hidden', purpose: 'Preview and approve practice assignment batches for a student.' },
  // Card 007 (frozen): { path: '/admin/subscriptions', pageName: 'AdminSubscriptionRequestsPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Manual subscription request queue and tier application.' },
  { path: '/admin/teacher-applications', pageName: 'AdminTeacherApplicationsPage', role: 'admin', module: 'Admin', status: 'core', priority: 'P1', navPriority: 'primary', purpose: 'Teacher application review and invitation.' },
  { path: '/teacher-activate', pageName: 'TeacherActivatePage', role: 'public', module: 'Auth', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Teacher invitation claim and account activation.' },
  { path: '/activate', pageName: 'ActivateAccountPage', role: 'public', module: 'Auth', status: 'core', priority: 'P0', navPriority: 'hidden', purpose: 'Role-neutral invitation claim and account activation.' },
  // Card 007 (frozen): { path: '/admin/billing-interest', pageName: 'AdminOperationsPlaceholderPage', role: 'admin', module: 'Admin', status: 'placeholder', priority: 'P3', navPriority: 'hidden', purpose: 'Future billing interest admin placeholder.' },
  { path: '/admin/system', pageName: 'AdminOperationsPlaceholderPage', role: 'admin', module: 'Admin', status: 'placeholder', priority: 'P3', navPriority: 'hidden', purpose: 'Future system status admin placeholder.' },
  { path: '/organization/students/:studentId/learning-profile', pageName: 'StudentLearningProfilePage', role: 'organization', module: 'Learning Intelligence', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Organization-scoped learning profile.' },
  { path: '/students/:studentId/learning-profile', pageName: 'StudentLearningProfilePage', role: 'organization', module: 'Learning Intelligence', status: 'demo', priority: 'P2', navPriority: 'hidden', purpose: 'Advanced learning profile direct route.' },
  { path: '/organization/learning-operations', pageName: 'LearningOperationsDashboardPage', role: 'organization', module: 'Learning Operations', status: 'core', priority: 'P2', navPriority: 'hidden', purpose: 'Curriculum analytics and warehouse export readiness; the router also admits administrators.' },
  { path: '/organization/learning-automation', pageName: 'LearningAutomationConsolePage', role: 'organization', module: 'Learning Operations', status: 'core', priority: 'P2', navPriority: 'hidden', purpose: 'Preview and approve practice assignment batches; the router also admits administrators.' },
]

/**
 * Paths `AppRouter` registers that are deliberately not in `routeMetadata`,
 * each with the reason. Everything else the router registers must be listed
 * above; `tests/component/routeRegistry.test.ts` holds the three tables to that.
 */
export const routesWithoutMetadata: Readonly<Record<string, string>> = {
  '*': 'Catch-all: renders NotFoundPage for every path nobody registered.',
  '/unauthorized': 'Error page ("sign in to continue"); nothing in the app sends anyone there today, a signed-out user is sent to /login.',
  '/forbidden': 'Error page RoleRoute sends a user to when their role is not allowed; not a destination of its own.',
  '/assistant': 'Redirect to /chat, kept so old links still land; it renders no page.',
}

