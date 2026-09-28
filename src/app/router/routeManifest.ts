/**
 * The route manifest: the one place a route is defined.
 *
 * Every page the app serves, the guard in front of it, the navigation entry
 * that leads to it, its translation key and its metadata live here, and
 * nowhere else. `AppRoutes` builds the router and its guards from
 * `pageRoutes` and `legacyRedirects`; `@/lib/navigation` builds every role's
 * navigation from the `nav` entries; `getDefaultRouteForRole` reads
 * `roleHomePaths`. Decided in stoasystem/stoa-frontend#13 (point 8) and built
 * in #45.
 *
 * A guard here only decides what the browser shows. The backend's own
 * authorisation stays the authority on every request.
 */
import { lazyPage, type LazyPage } from '@/app/router/lazyPage'
import type { UserRole } from '@/types/user'

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

/** Who may open a route. Generated into ProtectedRoute / RoleRoute. */
export type RouteAccess =
  | { kind: 'public' }
  /** Any signed-in account, whatever its role. */
  | { kind: 'signedIn' }
  /** A signed-in account holding one of these roles. */
  | { kind: 'roles'; roles: readonly UserRole[] }

/** Whose navigation an entry appears in. Organisation roles share one. */
export type AppNavArea = 'student' | 'parent' | 'teacher' | 'admin' | 'organization'

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

export type RouteStatus = 'core' | 'demo' | 'placeholder'

export type RouteNav = {
  area: AppNavArea
  /** English fallback, shown when `labelKey` is missing or untranslated. */
  label: string
  /** Key in the `common` namespace; `navigation.short.*` is tried on a phone. */
  labelKey?: string
  priority: 'primary' | 'secondary'
  icon: AppNavIcon
  /** Offered in the phone's bottom bar (first five per area). */
  mobile?: boolean
  description?: string
}

export type RouteMeta = {
  module: string
  status: RouteStatus
  purpose: string
}

export type PageRoute = {
  /** A react-router path pattern. */
  path: string
  access: RouteAccess
  page: LazyPage
  /** Passed to the page as props. */
  props?: Record<string, unknown>
  /** Key in the `common` namespace naming the page; passed to it as `titleKey`. */
  titleKey?: string
  /** Rendered only where demo surfaces are switched on. */
  demoSurface?: boolean
  /**
   * Shown instead of refusing a visitor the guard would turn away. Only `/`
   * uses it: it is the student's star map, and the sign-in page (or the way to
   * one's own home) for everybody else.
   */
  refusedPage?: LazyPage
  nav?: readonly RouteNav[]
  meta: RouteMeta
}

export type LegacyRedirectInput = {
  params: Readonly<Record<string, string | undefined>>
  search: URLSearchParams
  /** The old address as it arrived, still percent-encoded. */
  pathname?: string
}

export type LegacyRedirect = {
  /** The old path pattern; `/*` covers everything beneath it. */
  from: string
  to: string | ((input: LegacyRedirectInput) => string)
  /** The guard the old route sat behind, so the refusals stay as they were. */
  access: RouteAccess
  /**
   * Only these roles are redirected; everyone else keeps the page registered
   * at the same path. Without it, `from` must not also be a page.
   */
  onlyFor?: readonly UserRole[]
  /** Carry the query string (minus what `to` consumed) and location state. */
  carryContext?: boolean
  /** Query parameters `to` has already moved into the path. */
  consumes?: readonly string[]
  /** Where the redirect was decided. */
  decision: string
}

// ---------------------------------------------------------------------------
// Constants other modules need
// ---------------------------------------------------------------------------

/** The one screen an account under a forced password change can still use. */
export const CHANGE_PASSWORD_PATH = '/settings/password'

export const ASK_PATH = '/ask'

export const roleHomePaths: Record<AppNavArea, string> = {
  student: '/',
  parent: '/parent',
  teacher: '/tutor',
  admin: '/admin',
  organization: '/organization',
}

export function navAreaForRole(role: UserRole): AppNavArea {
  if (role === 'organization_admin' || role === 'school_teacher' || role === 'school_viewer') {
    return 'organization'
  }
  return role
}

const PUBLIC: RouteAccess = { kind: 'public' }
const SIGNED_IN: RouteAccess = { kind: 'signedIn' }
const only = (...roles: UserRole[]): RouteAccess => ({ kind: 'roles', roles })

const STUDENT = only('student')
const PARENT = only('parent')
const TEACHER = only('teacher')
const ADMIN = only('admin')
const ORGANIZATION = only('admin', 'organization_admin', 'school_teacher', 'school_viewer')
const ME_ACCESS = only('student', 'admin', 'organization_admin', 'school_teacher', 'school_viewer')

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const EntryPage = lazyPage('EntryPage', () => import('@/pages/entry/EntryPage'))
const RegisterPage = lazyPage('RegisterPage', () => import('@/pages/auth/RegisterPage'))
const TeacherActivatePage = lazyPage('TeacherActivatePage', () => import('@/pages/auth/TeacherActivatePage'))
const ActivateAccountPage = lazyPage('ActivateAccountPage', () => import('@/pages/auth/ActivateAccountPage'))
const ChangePasswordPage = lazyPage('ChangePasswordPage', () => import('@/pages/auth/ChangePasswordPage'))
const PrivacyPage = lazyPage('PrivacyPage', () => import('@/pages/legal/PrivacyPage'))
const TermsPage = lazyPage('TermsPage', () => import('@/pages/legal/TermsPage'))
const OnboardingPage = lazyPage('OnboardingPage', () => import('@/pages/onboarding/OnboardingPage'))
const SupportPage = lazyPage('SupportPage', () => import('@/pages/support/SupportPage'))
const UnauthorizedPage = lazyPage('UnauthorizedPage', () => import('@/pages/error/UnauthorizedPage'))
const ForbiddenPage = lazyPage('ForbiddenPage', () => import('@/pages/error/ForbiddenPage'))
const NotFoundPage = lazyPage('NotFoundPage', () => import('@/pages/not-found/NotFoundPage'))

// Student: the planet redesign (#13), whose map is a star map since #72.
const MapHomePage = lazyPage('MapHomePage', () => import('@/pages/map/MapPages'))
const MapSubjectPage = lazyPage('MapSubjectPage', () => import('@/pages/map/MapPages'))
const MapNebulaPage = lazyPage('MapNebulaPage', () => import('@/pages/map/MapPages'))
const MapStarPage = lazyPage('MapStarPage', () => import('@/pages/map/MapPages'))
const ChapterPage = lazyPage('ChapterPage', () => import('@/pages/chapter/ChapterPages'))
const LessonStagePage = lazyPage('LessonStagePage', () => import('@/pages/chapter/ChapterPages'))
const AskPage = lazyPage('AskPage', () => import('@/pages/ask/AskPage'))
const MePage = lazyPage('MePage', () => import('@/pages/me/MePage'))
const StudentAssignmentsPage = lazyPage('StudentAssignmentsPage', () => import('@/pages/learning/StudentAssignmentsPage'))

const ParentDashboardPage = lazyPage('ParentDashboardPage', () => import('@/pages/parent/ParentDashboardPage'))
const ParentAccountOperationsPage = lazyPage('ParentAccountOperationsPage', () => import('@/pages/parent/ParentAccountOperationsPage'))
const ParentReportsPage = lazyPage('ParentReportsPage', () => import('@/pages/parent/ParentReportsPage'))
const ChildSummaryPage = lazyPage('ChildSummaryPage', () => import('@/pages/parent/ChildSummaryPage'))
const ParentChildProgressPage = lazyPage('ParentChildProgressPage', () => import('@/pages/parent/ParentChildProgressPage'))
const ChildReportPage = lazyPage('ChildReportPage', () => import('@/pages/parent/ChildReportPage'))
const ChildLearningHistoryPage = lazyPage('ChildLearningHistoryPage', () => import('@/pages/parent/ChildLearningHistoryPage'))

const LearningOperationsDashboardPage = lazyPage('LearningOperationsDashboardPage', () => import('@/pages/learning/LearningOperationsDashboardPage'))
const LearningAutomationConsolePage = lazyPage('LearningAutomationConsolePage', () => import('@/pages/learning/LearningAutomationConsolePage'))
const StudentLearningProfilePage = lazyPage('StudentLearningProfilePage', () => import('@/pages/learning/StudentLearningProfilePage'))

const TutorDashboardPage = lazyPage('TutorDashboardPage', () => import('@/pages/tutor/TutorDashboardPage'))
const TutorAvailabilityPage = lazyPage('TutorAvailabilityPage', () => import('@/pages/tutor/TutorAvailabilityPage'))
const TutorProfilePage = lazyPage('TutorProfilePage', () => import('@/pages/tutor/TutorProfilePage'))
const TutorHelpRequestDetailPage = lazyPage('TutorHelpRequestDetailPage', () => import('@/pages/tutor/TutorHelpRequestDetailPage'))

const AdminDashboardPage = lazyPage('AdminDashboardPage', () => import('@/pages/admin/Dashboard'))
const AdminAccountsPage = lazyPage('AdminAccountsPage', () => import('@/pages/admin/AdminAccountsPage'))
const AdminModerationPage = lazyPage('AdminModerationPage', () => import('@/pages/admin/AdminModerationPage'))
const AdminCurriculumPage = lazyPage('AdminCurriculumPage', () => import('@/pages/admin/AdminCurriculumPage'))
const AdminTeacherApplicationsPage = lazyPage('AdminTeacherApplicationsPage', () => import('@/pages/admin/AdminTeacherApplicationsPage'))
const AdminAccountOperationsPage = lazyPage('AdminAccountOperationsPage', () => import('@/pages/admin/AdminAccountOperationsPage'))
const AdminOperationsPlaceholderPage = lazyPage('AdminOperationsPlaceholderPage', () => import('@/pages/admin/OperationsPlaceholder'))

/* Card 007: payments and billing are frozen.
 *
 * STOA is assignment-only, so nothing is sold and no page may show a price, a
 * plan to buy or a billing entry. The page files under `src/pages/billing/`
 * and the admin billing pages are deliberately kept -- only their manifest
 * entries are withdrawn here, so the pages are unreachable rather than
 * deleted. The backend answers every paid route with 410 `billing_frozen`.
 *
 * To unfreeze: restore the loaders and entries below, and flip
 * `BILLING_AND_SUBSCRIPTION_ENABLED` in `stoa-backend/src/stoa/routers/billing.py`.
 *
const AdminSubscriptionRequestsPage = lazyPage('AdminSubscriptionRequestsPage', () => import('@/pages/admin/AdminSubscriptionRequestsPage'))
const AdminBillingCheckoutPage = lazyPage('AdminBillingCheckoutPage', () => import('@/pages/admin/AdminBillingCheckoutPage'))
const BillingPage = lazyPage('BillingPage', () => import('@/pages/billing/BillingPage'))
const CheckoutResultPage = lazyPage('CheckoutResultPage', () => import('@/pages/billing/CheckoutResultPage'))
const PaymentSettingsPage = lazyPage('PaymentSettingsPage', () => import('@/pages/billing/PaymentSettingsPage'))
const VirtualCheckoutPage = lazyPage('VirtualCheckoutPage', () => import('@/pages/billing/VirtualCheckoutPage'))

  // No `nav`: a parent reaches billing from the avatar menu, between Help and Sign out (#13, #46).
  { path: '/billing', access: SIGNED_IN, page: BillingPage, meta: { module: 'Billing', status: 'core', purpose: 'Plan and billing state.' } },
  { path: '/billing/payment-settings', access: SIGNED_IN, page: PaymentSettingsPage, meta: { module: 'Billing', status: 'core', purpose: 'Payment method and billing contact.' } },
  { path: '/billing/checkout/result', access: SIGNED_IN, page: CheckoutResultPage, meta: { module: 'Billing', status: 'demo', purpose: 'Checkout result.' } },
  { path: '/billing/checkout/demo', access: SIGNED_IN, page: VirtualCheckoutPage, meta: { module: 'Billing', status: 'demo', purpose: 'Virtual checkout demo.' } },
  { path: '/admin/subscriptions', access: ADMIN, page: AdminSubscriptionRequestsPage, nav: [{ area: 'admin', label: 'Subscriptions', priority: 'primary', icon: 'billing' }], meta: { module: 'Admin', status: 'core', purpose: 'Manual subscription request queue.' } },
  { path: '/admin/billing-interest', access: ADMIN, page: AdminOperationsPlaceholderPage, props: { title: 'Billing interest' }, meta: { module: 'Admin', status: 'placeholder', purpose: 'Future billing interest admin placeholder.' } },
  { path: '/admin/billing/checkout-recovery', access: ADMIN, page: AdminBillingCheckoutPage, meta: { module: 'Admin', status: 'core', purpose: 'Checkout recovery.' } },
 */

/* Card 020: the online classroom has no backend, so it shows nobody anything real.
 *
 * `liveClassroomService` answers every call from an array in the browser tab:
 * sessions vanish on reload, and every one of them names a student "Anna Meier"
 * and a tutor "Anna Keller". There is no classroom route in the backend at all.
 * The pages, the service and the mock data are all kept -- only the manifest
 * entries are withdrawn. Student `/classroom*` links now redirect to `/` (#13).
 * To bring the tutor side back: restore the loaders and entries below, and the
 * tutor dashboard link -- after `liveClassroomService` calls a real API.
 *
const TutorClassroomQueuePage = lazyPage('TutorClassroomQueuePage', () => import('@/features/live-classroom/pages/TutorClassroomQueuePage'))
const ClassroomLobbyPage = lazyPage('ClassroomLobbyPage', () => import('@/features/live-classroom/pages/ClassroomLobbyPage'))
const ClassroomRoomPage = lazyPage('ClassroomRoomPage', () => import('@/features/live-classroom/pages/ClassroomRoomPage'))
const ClassroomSummaryPage = lazyPage('ClassroomSummaryPage', () => import('@/features/live-classroom/pages/ClassroomSummaryPage'))
// Student side, superseded by the planet: live-classroom/pages/StudentClassroomHomePage, ScheduleClassroomPage.

  { path: '/tutor/classroom', access: TEACHER, page: TutorClassroomQueuePage, nav: [{ area: 'teacher', label: 'Classroom Queue', labelKey: 'navigation.classroomQueue', priority: 'primary', icon: 'classroom', mobile: true }], meta: { module: 'Online Classroom', status: 'core', purpose: 'Tutor classroom queue.' } },
  { path: '/tutor/classroom/sessions/:sessionId/lobby', access: TEACHER, page: ClassroomLobbyPage, props: { tutorMode: true }, meta: { module: 'Online Classroom', status: 'core', purpose: 'Tutor classroom lobby.' } },
  { path: '/tutor/classroom/sessions/:sessionId/room', access: TEACHER, page: ClassroomRoomPage, props: { tutorMode: true }, meta: { module: 'Online Classroom', status: 'core', purpose: 'Tutor live classroom room.' } },
  { path: '/tutor/classroom/sessions/:sessionId/summary', access: TEACHER, page: ClassroomSummaryPage, props: { tutorMode: true }, meta: { module: 'Online Classroom', status: 'core', purpose: 'Tutor classroom summary.' } },
 */

export const pageRoutes: readonly PageRoute[] = [
  // ---- public ------------------------------------------------------------
  {
    path: '/',
    access: STUDENT,
    page: MapHomePage,
    refusedPage: EntryPage,
    titleKey: 'studentRoutes.home.title',
    meta: { module: 'Star map', status: 'demo', purpose: 'Student: the default subject star map. Everyone else: sign-in, or the way to their own home.' },
  },
  { path: '/login', access: PUBLIC, page: EntryPage, meta: { module: 'Auth', status: 'core', purpose: 'User sign-in.' } },
  { path: '/register', access: PUBLIC, page: RegisterPage, meta: { module: 'Auth', status: 'core', purpose: 'Accounts are issued by an administrator; this page explains how to ask for one.' } },
  { path: '/teacher-activate', access: PUBLIC, page: TeacherActivatePage, meta: { module: 'Auth', status: 'core', purpose: 'Teacher invitation claim and account activation.' } },
  { path: '/activate', access: PUBLIC, page: ActivateAccountPage, meta: { module: 'Auth', status: 'core', purpose: 'Role-neutral invitation claim and account activation.' } },
  { path: '/privacy', access: PUBLIC, page: PrivacyPage, meta: { module: 'Legal', status: 'core', purpose: 'Privacy notice.' } },
  { path: '/terms', access: PUBLIC, page: TermsPage, meta: { module: 'Legal', status: 'core', purpose: 'Terms of use.' } },
  { path: '/onboarding', access: PUBLIC, page: OnboardingPage, meta: { module: 'Onboarding', status: 'demo', purpose: 'Role onboarding guide.' } },
  {
    path: '/support',
    access: PUBLIC,
    page: SupportPage,
    nav: [{ area: 'teacher', label: 'Support', labelKey: 'navigation.support', priority: 'secondary', icon: 'support', description: 'Tutor support and help.' }],
    meta: { module: 'Support', status: 'core', purpose: 'Support request entry.' },
  },
  { path: '/unauthorized', access: PUBLIC, page: UnauthorizedPage, meta: { module: 'Errors', status: 'core', purpose: 'Sign-in required.' } },
  { path: '/forbidden', access: PUBLIC, page: ForbiddenPage, meta: { module: 'Errors', status: 'core', purpose: 'Where a guard sends a role the route is not for.' } },
  { path: '*', access: PUBLIC, page: NotFoundPage, meta: { module: 'Errors', status: 'core', purpose: 'Anything no entry matches.' } },

  // ---- any signed-in account ---------------------------------------------
  {
    path: CHANGE_PASSWORD_PATH,
    access: SIGNED_IN,
    page: ChangePasswordPage,
    meta: { module: 'Auth', status: 'core', purpose: 'Self-service password change for teachers and parents, and the forced change for every role. Students are sent to /me (see legacyRedirects), except under a forced change.' },
  },

  // ---- student -----------------------------------------------------------
  // No student route carries a `nav` entry: the student's bar holds only the
  // logo, the bell and the avatar (#13 point 5). The star map is the navigation;
  // /me is reached from the avatar menu, /ask from the composer.
  // The star map's three layers (#72 point 8); fixture data until #48.
  { path: '/map/:subjectId', access: STUDENT, page: MapSubjectPage, titleKey: 'studentRoutes.map.title', meta: { module: 'Star map', status: 'demo', purpose: 'A subject star map.' } },
  { path: '/map/:subjectId/:topicId', access: STUDENT, page: MapNebulaPage, titleKey: 'studentRoutes.nebula.title', meta: { module: 'Star map', status: 'demo', purpose: 'A nebula (topic) of a star map.' } },
  { path: '/map/:subjectId/:topicId/:unitId', access: STUDENT, page: MapStarPage, titleKey: 'studentRoutes.unit.title', meta: { module: 'Star map', status: 'demo', purpose: 'A star (unit, knowledge point) of a nebula.' } },
  { path: '/chapter/:unitId', access: STUDENT, page: ChapterPage, titleKey: 'studentRoutes.chapter.title', meta: { module: 'Chapter', status: 'core', purpose: 'The chapter of a knowledge point: its lessons in order, with progress.' } },
  { path: '/chapter/:unitId/:lessonId', access: STUDENT, page: LessonStagePage, titleKey: 'studentRoutes.lesson.title', meta: { module: 'Chapter', status: 'core', purpose: 'The practice stage of a lesson, with Ask beside it.' } },
  {
    path: ASK_PATH,
    access: STUDENT,
    page: AskPage,
    titleKey: 'studentRoutes.ask.title',
    meta: { module: 'Ask', status: 'placeholder', purpose: 'Ask: the star map with a side panel on a desktop, a full-screen sheet on a phone.' },
  },
  { path: '/ask/:conversationId', access: STUDENT, page: AskPage, titleKey: 'studentRoutes.ask.title', meta: { module: 'Ask', status: 'placeholder', purpose: 'One Ask conversation.' } },
  {
    // Also the profile page of administrators and the organisation roles,
    // who have no other (#46); teachers and parents keep their own.
    path: '/me',
    access: ME_ACCESS,
    page: MePage,
    titleKey: 'studentRoutes.me.title',
    meta: { module: 'Account', status: 'core', purpose: 'Account page: profile, language, notification preferences, password change.' },
  },
  // Kept, but out of navigation: reached from the bell (#13 point 3).
  { path: '/assignments', access: STUDENT, page: StudentAssignmentsPage, meta: { module: 'Learning', status: 'core', purpose: 'Teacher-assigned work, reached from a notification.' } },

  // ---- parent ------------------------------------------------------------
  {
    path: '/parent',
    access: PARENT,
    page: ParentDashboardPage,
    nav: [{ area: 'parent', label: 'Overview', labelKey: 'navigation.overview', priority: 'primary', icon: 'dashboard', mobile: true, description: 'Child learning summary and parent next steps.' }],
    meta: { module: 'Parent', status: 'core', purpose: 'Parent overview and child list.' },
  },
  { path: '/parent/account-operations', access: PARENT, page: ParentAccountOperationsPage, meta: { module: 'Parent', status: 'core', purpose: 'Parent account operations.' } },
  {
    path: '/parent/reports',
    access: PARENT,
    page: ParentReportsPage,
    nav: [{ area: 'parent', label: 'Reports', labelKey: 'navigation.reports', priority: 'primary', icon: 'reports', mobile: true, description: 'Open weekly and monthly child reports.' }],
    meta: { module: 'Parent', status: 'core', purpose: 'Parent report hub for weekly and monthly child reports.' },
  },
  { path: '/parent/children/:childId', access: PARENT, page: ChildSummaryPage, meta: { module: 'Parent', status: 'core', purpose: 'Child summary detail.' } },
  { path: '/parent/children/:childId/progress', access: PARENT, page: ParentChildProgressPage, meta: { module: 'Parent', status: 'core', purpose: 'Child progress.' } },
  { path: '/parent/children/:childId/report', access: PARENT, page: ChildReportPage, meta: { module: 'Parent', status: 'core', purpose: 'Weekly child report.' } },
  { path: '/parent/children/:childId/history', access: PARENT, page: ChildLearningHistoryPage, meta: { module: 'Parent', status: 'core', purpose: 'Child learning history.' } },

  // ---- organisation (and admin) ------------------------------------------
  { path: '/organization/learning-operations', access: ORGANIZATION, page: LearningOperationsDashboardPage, meta: { module: 'Learning Operations', status: 'core', purpose: 'Organisation learning operations.' } },
  { path: '/organization/students/:studentId/learning-profile', access: ORGANIZATION, page: StudentLearningProfilePage, demoSurface: true, meta: { module: 'Learning Intelligence', status: 'demo', purpose: 'Organisation-scoped learning profile.' } },
  { path: '/organization/learning-automation', access: ORGANIZATION, page: LearningAutomationConsolePage, meta: { module: 'Learning Operations', status: 'core', purpose: 'Organisation learning automation.' } },
  { path: '/students/:studentId/learning-profile', access: ORGANIZATION, page: StudentLearningProfilePage, demoSurface: true, meta: { module: 'Learning Intelligence', status: 'demo', purpose: 'Advanced learning profile direct route.' } },

  // ---- teacher -----------------------------------------------------------
  {
    path: '/tutor',
    access: TEACHER,
    page: TutorDashboardPage,
    nav: [{ area: 'teacher', label: 'Requests', labelKey: 'navigation.requests', priority: 'primary', icon: 'requests', mobile: true, description: 'Tutor help requests queue.' }],
    meta: { module: 'Tutor', status: 'core', purpose: 'Tutor request queue.' },
  },
  {
    path: '/tutor/availability',
    access: TEACHER,
    page: TutorAvailabilityPage,
    nav: [{ area: 'teacher', label: 'Availability', labelKey: 'navigation.availability', priority: 'primary', icon: 'settings', mobile: true, description: 'Tutor availability and subjects.' }],
    meta: { module: 'Tutor', status: 'core', purpose: 'Tutor availability.' },
  },
  { path: '/tutor/learning-automation', access: TEACHER, page: LearningAutomationConsolePage, meta: { module: 'Tutor', status: 'core', purpose: 'Tutor learning automation.' } },
  {
    path: '/tutor/profile',
    access: TEACHER,
    page: TutorProfilePage,
    nav: [{ area: 'teacher', label: 'Profile', labelKey: 'navigation.profile', priority: 'primary', icon: 'profile', mobile: true, description: 'Tutor account, contact, credentials, and payout details.' }],
    meta: { module: 'Tutor', status: 'core', purpose: 'Tutor profile, contact, verification, and payout settlement details.' },
  },
  { path: '/tutor/requests/:requestId', access: TEACHER, page: TutorHelpRequestDetailPage, meta: { module: 'Tutor', status: 'core', purpose: 'Tutor request detail and status update.' } },

  // ---- admin -------------------------------------------------------------
  // Navigation order follows the order of these entries.
  {
    path: '/admin',
    access: ADMIN,
    page: AdminDashboardPage,
    nav: [{ area: 'admin', label: 'Overview', labelKey: 'navigation.overview', priority: 'primary', icon: 'dashboard', mobile: true, description: 'Admin operations overview.' }],
    meta: { module: 'Admin', status: 'core', purpose: 'Admin operations overview.' },
  },
  {
    path: '/admin/users',
    access: ADMIN,
    page: AdminAccountsPage,
    nav: [{ area: 'admin', label: 'Accounts', priority: 'primary', icon: 'students', description: 'Invite, assign, reset, suspend and archive accounts.' }],
    meta: { module: 'Admin', status: 'core', purpose: 'Account console: invite, assign, reset password, suspend and archive.' },
  },
  {
    path: '/admin/moderation',
    access: ADMIN,
    page: AdminModerationPage,
    nav: [{ area: 'admin', label: 'Moderation', priority: 'primary', icon: 'support', mobile: true, description: 'Reported learning content and internal moderation actions.' }],
    meta: { module: 'Admin', status: 'core', purpose: 'Reported learning content and moderation.' },
  },
  {
    path: '/admin/curriculum',
    access: ADMIN,
    page: AdminCurriculumPage,
    nav: [{ area: 'admin', label: 'Curriculum', priority: 'primary', icon: 'practice', description: 'Curriculum authoring, review, migration, and evidence console.' }],
    meta: { module: 'Admin', status: 'core', purpose: 'Curriculum editor, review, migration, and evidence console.' },
  },
  {
    path: '/admin/teacher-applications',
    access: ADMIN,
    page: AdminTeacherApplicationsPage,
    nav: [{ area: 'admin', label: 'Teacher applications', priority: 'primary', icon: 'tutors', description: 'Review teacher applications and send activation invitations.' }],
    meta: { module: 'Admin', status: 'core', purpose: 'Teacher application review and invitation.' },
  },
  { path: '/admin/learning-operations', access: ADMIN, page: LearningOperationsDashboardPage, meta: { module: 'Admin', status: 'core', purpose: 'Platform learning operations.' } },
  { path: '/admin/learning-automation', access: ADMIN, page: LearningAutomationConsolePage, meta: { module: 'Admin', status: 'core', purpose: 'Platform learning automation.' } },
  { path: '/admin/account-operations', access: ADMIN, page: AdminAccountOperationsPage, meta: { module: 'Admin', status: 'core', purpose: 'Account operations queue.' } },
  { path: '/admin/system', access: ADMIN, page: AdminOperationsPlaceholderPage, props: { title: 'System status' }, meta: { module: 'Admin', status: 'placeholder', purpose: 'Future system status admin placeholder.' } },
]

// ---------------------------------------------------------------------------
// Legacy redirects (#13 point 2): no old student link ends on a 404.
// ---------------------------------------------------------------------------

/*
 * What a conversation id looks like: the backend issues UUIDs; letters,
 * digits, `-` and `_` cover those and anything shorter a test uses. Anything
 * else -- `.`, `..` (which a router resolves to the parent, so `/ask/..` would
 * land on `/`), a slash, an escape -- is treated as no id at all.
 */
const CONVERSATION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/

/** `/ask`, or `/ask/<id>` when the old link named a conversation. */
export function askPathFor(conversationId: unknown): string {
  // Anything but a string (a number, an object from a malformed payload) is no id.
  const id = typeof conversationId === 'string' ? conversationId.trim() : ''
  return CONVERSATION_ID.test(id) ? `${ASK_PATH}/${id}` : ASK_PATH
}

/*
 * How an old `/chat` link names a conversation. Today's ChatPage keeps the
 * open conversation in component state only and never writes it to the URL,
 * so no link the app produced carries one. These are the two forms an
 * outside link (a notification, a bookmark, an email) could use; both land
 * on `/ask/:conversationId`, and every other query parameter and the
 * location state (the practice / upload hand-off) ride along.
 */
const CONVERSATION_QUERY = 'conversationId'
const toAsk = ({ params, search }: LegacyRedirectInput) =>
  askPathFor(params.conversationId ?? search.get(CONVERSATION_QUERY))

/*
 * `/planet/...` became `/map/...` when the planet became a star map (#72
 * point 8). The same segments carry over, read from the address as it
 * arrived (still percent-encoded) and decoded exactly once. A segment that
 * is not a plain id after that one decoding -- `.`, `..`, anything with a
 * `/`, `\` or `%` in it (a double-encoded `%252e%252e` decodes to `%2e%2e`) --
 * or more segments than a star's address has, lands on the home map.
 */
const MAP_SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$/

export function mapPathForLegacyPlanet(pathname: string | undefined): string {
  // Case-insensitive, as React Router matches `/planet/*`: `/Planet/math` lands here too.
  const match = /^\/planet(\/.*)?$/i.exec(pathname ?? '')
  if (!match) return '/'
  const raw = (match[1] ?? '').split('/').filter((segment) => segment !== '')
  if (raw.length === 0 || raw.length > 3) return '/'
  const decoded: string[] = []
  for (const segment of raw) {
    let value: string
    try {
      value = decodeURIComponent(segment)
    } catch {
      return '/'
    }
    if (!MAP_SEGMENT.test(value)) return '/'
    decoded.push(value)
  }
  return `/map/${decoded.map(encodeURIComponent).join('/')}`
}

const toMap = ({ pathname }: LegacyRedirectInput) => mapPathForLegacyPlanet(pathname)

export const legacyRedirects: readonly LegacyRedirect[] = [
  { from: '/planet/*', to: toMap, access: STUDENT, carryContext: true, decision: '#72 §8' },
  { from: '/learn/*', to: '/', access: STUDENT, decision: '#13 §2' },
  { from: '/dashboard', to: '/', access: STUDENT, decision: '#13 §2' },
  { from: '/practice/*', to: '/', access: STUDENT, decision: '#13 §2' },
  { from: '/question-bank/*', to: '/', access: STUDENT, decision: '#13 §2' },
  { from: '/classroom/*', to: '/', access: STUDENT, decision: '#13 §2' },
  // Learning history is gone (#13 §3); it used to forward to /learn/progress.
  { from: '/learning-history', to: '/', access: STUDENT, decision: '#13 §3' },
  { from: '/chat', to: toAsk, access: STUDENT, carryContext: true, consumes: [CONVERSATION_QUERY], decision: '#13 §2' },
  // The id is taken from the path; a `conversationId` in the query is dropped,
  // so Ask never sees two ids (it reads only the path's).
  { from: '/chat/:conversationId', to: toAsk, access: STUDENT, carryContext: true, consumes: [CONVERSATION_QUERY], decision: '#13 §2' },
  // Always public: it used to forward to /chat before any guard ran.
  { from: '/assistant', to: toAsk, access: PUBLIC, carryContext: true, consumes: [CONVERSATION_QUERY], decision: '#13 §2' },
  { from: '/profile', to: '/me', access: STUDENT, decision: '#13 §2' },
  // Students change their password on /me (#46); everyone else keeps the page
  // here, and so does any account under a forced change (RoleScopedRedirect).
  { from: CHANGE_PASSWORD_PATH, to: '/me', access: SIGNED_IN, onlyFor: ['student'], decision: '#13 §2' },
]
