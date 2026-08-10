import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthBootstrap } from '@/app/router/AuthBootstrap'
import { DemoSurfaceRoute } from '@/app/router/DemoSurfaceRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleRoute } from '@/app/router/RoleRoute'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { AdminDashboardPage } from '@/pages/admin/Dashboard'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import { AdminFeedbackPage } from '@/pages/admin/Feedback'
import { AdminHelpRequestsPage } from '@/pages/admin/HelpRequests'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'
import { AdminOperationsPlaceholderPage } from '@/pages/admin/OperationsPlaceholder'
import { AdminReportOperationsPage } from '@/pages/admin/ReportOperationsPage'
import { AdminSupportTicketDetailPage } from '@/pages/admin/AdminSupportTicketDetailPage'
import { AdminSupportTicketsPage } from '@/pages/admin/AdminSupportTicketsPage'
import { AdminSubscriptionRequestsPage } from '@/pages/admin/AdminSubscriptionRequestsPage'
import { AdminBillingCheckoutPage } from '@/pages/admin/AdminBillingCheckoutPage'
import { AdminUsagePage } from '@/pages/admin/Usage'
import { AdvancedAnalyticsPage } from '@/pages/admin/AdvancedAnalyticsPage'
import { RetentionPage } from '@/pages/admin/RetentionPage'
import { BillingPage } from '@/pages/billing/BillingPage'
import { CheckoutResultPage } from '@/pages/billing/CheckoutResultPage'
import { PaymentSettingsPage } from '@/pages/billing/PaymentSettingsPage'
import { VirtualCheckoutPage } from '@/pages/billing/VirtualCheckoutPage'
import { ContactPage } from '@/pages/contact/ContactPage'
import { StudentAssistantEntryPage } from '@/pages/assistant/StudentAssistantEntryPage'
import { ClassroomLobbyPage } from '@/features/live-classroom/pages/ClassroomLobbyPage'
import { ClassroomRoomPage } from '@/features/live-classroom/pages/ClassroomRoomPage'
import { ClassroomSummaryPage } from '@/features/live-classroom/pages/ClassroomSummaryPage'
import { ScheduleClassroomPage } from '@/features/live-classroom/pages/ScheduleClassroomPage'
import { StudentClassroomHomePage } from '@/features/live-classroom/pages/StudentClassroomHomePage'
import { TutorClassroomQueuePage } from '@/features/live-classroom/pages/TutorClassroomQueuePage'
import { ForbiddenPage } from '@/pages/error/ForbiddenPage'
import { UnauthorizedPage } from '@/pages/error/UnauthorizedPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { HomeV2Page } from '@/pages/home-v2/HomeV2Page'
import { ForParentsPage } from '@/pages/landing/ForParentsPage'
import { ForSchoolsPage } from '@/pages/landing/ForSchoolsPage'
import { ForTutoringCentersPage } from '@/pages/landing/ForTutoringCentersPage'
import { HowItWorksPage } from '@/pages/landing/HowItWorksPage'
import { TeacherSupportPage } from '@/pages/landing/TeacherSupportPage'
import { StudentLearningHistoryPage } from '@/pages/learning-history/StudentLearningHistoryPage'
import { CurriculumGraphPage } from '@/pages/learning/CurriculumGraphPage'
import { LearningAutomationConsolePage } from '@/pages/learning/LearningAutomationConsolePage'
import { LearningOperationsDashboardPage } from '@/pages/learning/LearningOperationsDashboardPage'
import { StudentLearningProfilePage } from '@/pages/learning/StudentLearningProfilePage'
import { StudentAssignmentsPage } from '@/pages/learning/StudentAssignmentsPage'
import { WeakPointDiagnosisPage } from '@/pages/learning/WeakPointDiagnosisPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { ChildLearningHistoryPage } from '@/pages/parent/ChildLearningHistoryPage'
import { ParentMonthlyReportPage } from '@/pages/parent/ParentMonthlyReportPage'
import { ParentAccountOperationsPage } from '@/pages/parent/ParentAccountOperationsPage'
import { ParentChildProgressPage } from '@/pages/parent/ParentChildProgressPage'
import { ChildReportPage } from '@/pages/parent/ChildReportPage'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { ParentReportsPage } from '@/pages/parent/ParentReportsPage'
import { OrganizationAnalyticsPage } from '@/pages/organization/OrganizationAnalyticsPage'
import { OrganizationDashboardPage } from '@/pages/organization/OrganizationDashboardPage'
import { OrganizationReportsPage } from '@/pages/organization/OrganizationReportsPage'
import { OrganizationStudentsPage } from '@/pages/organization/OrganizationStudentsPage'
import { OrganizationTutorsPage } from '@/pages/organization/OrganizationTutorsPage'
import { TutorAssignmentBoardPage } from '@/pages/organization/TutorAssignmentBoardPage'
import { PartnershipOnboardingPage } from '@/pages/partnership/PartnershipOnboardingPage'
import { PricingPage } from '@/pages/pricing/PricingPage'
import { QaPage } from '@/pages/qa/QaPage'
import { QuestionBankHomePage } from '@/pages/question-bank/QuestionBankHomePage'
import { QuestionBankMistakesReviewPage } from '@/pages/question-bank/MistakesReviewPage'
import { QuestionSessionPage } from '@/pages/question-bank/QuestionSessionPage'
import { QuestionSetOverviewPage } from '@/pages/question-bank/QuestionSetOverviewPage'
import { QuestionSetResultPage } from '@/pages/question-bank/QuestionSetResultPage'
import { SavedQuestionSetsPage } from '@/pages/question-bank/SavedQuestionSetsPage'
import { SubjectQuestionBankPage } from '@/pages/question-bank/SubjectQuestionBankPage'
import { TopicQuestionBankPage } from '@/pages/question-bank/TopicQuestionBankPage'
import { LessonPage } from '@/pages/practice/LessonPage'
import { LessonResultPage } from '@/pages/practice/LessonResultPage'
import { MistakesReviewPage } from '@/pages/practice/MistakesReviewPage'
import { PracticeOverviewPage } from '@/pages/practice/PracticeOverviewPage'
import { SubjectPathPage } from '@/pages/practice/SubjectPathPage'
import { TopicRoadmapPage } from '@/pages/practice/TopicRoadmapPage'
import { ReferralsPage } from '@/pages/referrals/ReferralsPage'
import { StudentProfilePage } from '@/pages/profile/StudentProfilePage'
import { LoginPage } from '@/pages/login/LoginPage'
import { SupportTicketDetailPage } from '@/pages/support/SupportTicketDetailPage'
import { SupportTicketsPage } from '@/pages/support/SupportTicketsPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { SupportPage } from '@/pages/support/SupportPage'
import { TutorAvailabilityPage } from '@/pages/tutor/TutorAvailabilityPage'
import { TutorDashboardPage } from '@/pages/tutor/TutorDashboardPage'
import { TutorHelpRequestDetailPage } from '@/pages/tutor/TutorHelpRequestDetailPage'
import { TutorProfilePage } from '@/pages/tutor/TutorProfilePage'
import { ChatSkeleton } from '@/components/chat/ChatSkeleton'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

// Heavy pages are code-split so the initial bundle stays small.
// Each has a matching skeleton fallback so users see a layout instantly.
const ChatPage = lazy(() =>
  import('@/pages/chat/ChatPage').then((m) => ({ default: m.ChatPage }))
)
const StudentDashboardPage = lazy(() =>
  import('@/pages/dashboard/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage }))
)

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <Routes>
        <Route path="/" element={<HomeV2Page />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/qa" element={<QaPage />} />
        <Route path="/for-parents" element={<ForParentsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/ai-homework-help" element={<HowItWorksPage />} />
        <Route path="/teacher-support" element={<TeacherSupportPage />} />
        <Route path="/for-schools" element={<ForSchoolsPage />} />
        <Route path="/for-tutoring-centers" element={<ForTutoringCentersPage />} />
        <Route path="/partnership/onboarding" element={<PartnershipOnboardingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/assistant" element={<StudentAssistantEntryPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/billing/payment-settings" element={<PaymentSettingsPage />} />
          <Route path="/billing/checkout/result" element={<CheckoutResultPage />} />
          <Route path="/billing/checkout/demo" element={<VirtualCheckoutPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/support/tickets" element={<SupportTicketsPage />} />
          <Route path="/support/tickets/:ticketId" element={<SupportTicketDetailPage />} />
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <StudentDashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/chat"
              element={
                <Suspense fallback={<ChatSkeleton />}>
                  <ChatPage />
                </Suspense>
              }
            />
            <Route path="/classroom" element={<StudentClassroomHomePage />} />
            <Route path="/classroom/schedule" element={<ScheduleClassroomPage />} />
            <Route path="/classroom/sessions/:sessionId/lobby" element={<ClassroomLobbyPage />} />
            <Route path="/classroom/sessions/:sessionId/room" element={<ClassroomRoomPage />} />
            <Route path="/classroom/sessions/:sessionId/summary" element={<ClassroomSummaryPage />} />
            <Route path="/practice" element={<PracticeOverviewPage />} />
            <Route path="/assignments" element={<StudentAssignmentsPage />} />
            <Route path="/practice/mistakes" element={<MistakesReviewPage />} />
            <Route path="/question-bank" element={<QuestionBankHomePage />} />
            <Route path="/question-bank/mistakes" element={<QuestionBankMistakesReviewPage />} />
            <Route path="/question-bank/saved" element={<SavedQuestionSetsPage />} />
            <Route path="/question-bank/sets/:setId" element={<QuestionSetOverviewPage />} />
            <Route path="/question-bank/session/:sessionId" element={<QuestionSessionPage />} />
            <Route path="/question-bank/session/:sessionId/result" element={<QuestionSetResultPage />} />
            <Route path="/question-bank/:subjectId/:topicId" element={<TopicQuestionBankPage />} />
            <Route path="/question-bank/:subjectId" element={<SubjectQuestionBankPage />} />
            <Route path="/practice/:subjectId/:topicId" element={<TopicRoadmapPage />} />
            <Route path="/practice/:subjectId/:topicId/lessons/:lessonId" element={<LessonPage />} />
            <Route path="/practice/:subjectId/:topicId/lessons/:lessonId/result" element={<LessonResultPage />} />
            <Route path="/practice/:subjectId" element={<SubjectPathPage />} />
            <Route path="/practice/:subjectId/lessons/:lessonId" element={<LessonPage />} />
            <Route path="/practice/:subjectId/lessons/:lessonId/result" element={<LessonResultPage />} />
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/learning-history" element={<StudentLearningHistoryPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['parent']} />}>
            <Route path="/parent" element={<ParentDashboardPage />} />
            <Route path="/parent/account-operations" element={<ParentAccountOperationsPage />} />
            <Route path="/parent/reports" element={<ParentReportsPage />} />
            <Route path="/parent/children/:childId" element={<ChildSummaryPage />} />
            <Route path="/parent/children/:childId/progress" element={<ParentChildProgressPage />} />
            <Route path="/parent/children/:childId/report" element={<ChildReportPage />} />
            <Route path="/parent/children/:childId/monthly-report" element={<ParentMonthlyReportPage />} />
            <Route
              path="/parent/children/:childId/history"
              element={<ChildLearningHistoryPage />}
            />
          </Route>
          <Route element={<RoleRoute allowedRoles={['admin', 'organization_admin', 'school_teacher', 'school_viewer']} />}>
            <Route path="/organization" element={<DemoSurfaceRoute><OrganizationDashboardPage /></DemoSurfaceRoute>} />
            <Route path="/organization/students" element={<DemoSurfaceRoute><OrganizationStudentsPage /></DemoSurfaceRoute>} />
            <Route path="/organization/tutors" element={<DemoSurfaceRoute><OrganizationTutorsPage /></DemoSurfaceRoute>} />
            <Route path="/organization/reports" element={<DemoSurfaceRoute><OrganizationReportsPage /></DemoSurfaceRoute>} />
            <Route path="/organization/analytics" element={<DemoSurfaceRoute><OrganizationAnalyticsPage /></DemoSurfaceRoute>} />
            <Route path="/organization/learning-operations" element={<LearningOperationsDashboardPage />} />
            <Route path="/organization/tutor-assignment" element={<DemoSurfaceRoute><TutorAssignmentBoardPage /></DemoSurfaceRoute>} />
            <Route path="/organization/students/:studentId/learning-profile" element={<DemoSurfaceRoute><StudentLearningProfilePage /></DemoSurfaceRoute>} />
            <Route path="/organization/learning-automation" element={<LearningAutomationConsolePage />} />
            <Route path="/students/:studentId/learning-profile" element={<DemoSurfaceRoute><StudentLearningProfilePage /></DemoSurfaceRoute>} />
            <Route path="/students/:studentId/diagnosis" element={<DemoSurfaceRoute><WeakPointDiagnosisPage /></DemoSurfaceRoute>} />
            <Route path="/students/:studentId/curriculum-graph" element={<DemoSurfaceRoute><CurriculumGraphPage /></DemoSurfaceRoute>} />
            <Route path="/curriculum-graph" element={<DemoSurfaceRoute><CurriculumGraphPage /></DemoSurfaceRoute>} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['tutor']} />}>
            <Route path="/tutor" element={<TutorDashboardPage />} />
            <Route path="/tutor/classroom" element={<TutorClassroomQueuePage />} />
            <Route path="/tutor/classroom/sessions/:sessionId/lobby" element={<ClassroomLobbyPage tutorMode />} />
            <Route path="/tutor/classroom/sessions/:sessionId/room" element={<ClassroomRoomPage tutorMode />} />
            <Route path="/tutor/classroom/sessions/:sessionId/summary" element={<ClassroomSummaryPage tutorMode />} />
            <Route path="/tutor/availability" element={<TutorAvailabilityPage />} />
            <Route path="/tutor/learning-automation" element={<LearningAutomationConsolePage />} />
            <Route path="/tutor/profile" element={<TutorProfilePage />} />
            <Route path="/tutor/requests/:requestId" element={<TutorHelpRequestDetailPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/learning-operations" element={<LearningOperationsDashboardPage />} />
            <Route path="/admin/advanced-analytics" element={<DemoSurfaceRoute><AdvancedAnalyticsPage /></DemoSurfaceRoute>} />
            <Route path="/admin/retention" element={<DemoSurfaceRoute><RetentionPage /></DemoSurfaceRoute>} />
            <Route path="/admin/usage" element={<AdminUsagePage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            <Route path="/admin/help-requests" element={<AdminHelpRequestsPage />} />
            <Route path="/admin/moderation" element={<AdminModerationPage />} />
            <Route path="/admin/report-operations" element={<AdminReportOperationsPage />} />
            <Route path="/admin/learning-automation" element={<LearningAutomationConsolePage />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionRequestsPage />} />
            <Route path="/admin/curriculum" element={<AdminCurriculumPage />} />
            <Route path="/admin/account-operations" element={<AdminAccountOperationsPage />} />
            <Route
              path="/admin/users"
              element={<AdminOperationsPlaceholderPage title="Users" />}
            />
            <Route
              path="/admin/support"
              element={<AdminSupportTicketsPage />}
            />
            <Route path="/admin/support/:ticketId" element={<AdminSupportTicketDetailPage />} />
            <Route
              path="/admin/billing-interest"
              element={
                <AdminOperationsPlaceholderPage
                  title="Billing interest"
                />
              }
            />
            <Route
              path="/admin/billing/checkout-recovery"
              element={<AdminBillingCheckoutPage />}
            />
            <Route
              path="/admin/system"
              element={
                <AdminOperationsPlaceholderPage
                  title="System status"
                />
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
