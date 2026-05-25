import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthBootstrap } from '@/app/router/AuthBootstrap'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleRoute } from '@/app/router/RoleRoute'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import { AdminDashboardPage } from '@/pages/admin/Dashboard'
import { AdminFeedbackPage } from '@/pages/admin/Feedback'
import { AdminHelpRequestsPage } from '@/pages/admin/HelpRequests'
import { AdminOperationsPlaceholderPage } from '@/pages/admin/OperationsPlaceholder'
import { AdminSupportTicketDetailPage } from '@/pages/admin/AdminSupportTicketDetailPage'
import { AdminSupportTicketsPage } from '@/pages/admin/AdminSupportTicketsPage'
import { AdminUsagePage } from '@/pages/admin/Usage'
import { BillingPage } from '@/pages/billing/BillingPage'
import { CheckoutResultPage } from '@/pages/billing/CheckoutResultPage'
import { VirtualCheckoutPage } from '@/pages/billing/VirtualCheckoutPage'
import { ChatPage } from '@/pages/chat/ChatPage'
import { StudentDashboardPage } from '@/pages/dashboard/StudentDashboardPage'
import { ForbiddenPage } from '@/pages/error/ForbiddenPage'
import { UnauthorizedPage } from '@/pages/error/UnauthorizedPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { HomePage } from '@/pages/home/HomePage'
import { ForParentsPage } from '@/pages/landing/ForParentsPage'
import { ForSchoolsPage } from '@/pages/landing/ForSchoolsPage'
import { ForTutoringCentersPage } from '@/pages/landing/ForTutoringCentersPage'
import { HowItWorksPage } from '@/pages/landing/HowItWorksPage'
import { TeacherSupportPage } from '@/pages/landing/TeacherSupportPage'
import { StudentLearningHistoryPage } from '@/pages/learning-history/StudentLearningHistoryPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { ChildLearningHistoryPage } from '@/pages/parent/ChildLearningHistoryPage'
import { ChildReportPage } from '@/pages/parent/ChildReportPage'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { PricingPage } from '@/pages/pricing/PricingPage'
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

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/for-parents" element={<ForParentsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/ai-homework-help" element={<HowItWorksPage />} />
        <Route path="/teacher-support" element={<TeacherSupportPage />} />
        <Route path="/for-schools" element={<ForSchoolsPage />} />
        <Route path="/for-tutoring-centers" element={<ForTutoringCentersPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/billing/checkout/demo" element={<VirtualCheckoutPage />} />
          <Route path="/billing/checkout/success" element={<CheckoutResultPage status="success" />} />
          <Route path="/billing/checkout/cancel" element={<CheckoutResultPage status="cancel" />} />
          <Route path="/billing/success" element={<CheckoutResultPage status="success" />} />
          <Route path="/billing/cancelled" element={<CheckoutResultPage status="cancel" />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/support/tickets" element={<SupportTicketsPage />} />
          <Route path="/support/tickets/:ticketId" element={<SupportTicketDetailPage />} />
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route path="/dashboard" element={<StudentDashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/learning-history" element={<StudentLearningHistoryPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['parent']} />}>
            <Route path="/parent" element={<ParentDashboardPage />} />
            <Route path="/parent/children/:childId" element={<ChildSummaryPage />} />
            <Route path="/parent/children/:childId/report" element={<ChildReportPage />} />
            <Route
              path="/parent/children/:childId/history"
              element={<ChildLearningHistoryPage />}
            />
          </Route>
          <Route element={<RoleRoute allowedRoles={['tutor']} />}>
            <Route path="/tutor" element={<TutorDashboardPage />} />
            <Route path="/tutor/availability" element={<TutorAvailabilityPage />} />
            <Route path="/tutor/requests/:requestId" element={<TutorHelpRequestDetailPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/usage" element={<AdminUsagePage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            <Route path="/admin/help-requests" element={<AdminHelpRequestsPage />} />
            <Route
              path="/admin/users"
              element={<AdminOperationsPlaceholderPage title="Users" endpoint="GET /admin/users" />}
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
                  endpoint="GET /admin/billing-interest"
                />
              }
            />
            <Route
              path="/admin/system"
              element={
                <AdminOperationsPlaceholderPage
                  title="System status"
                  endpoint="GET /admin/system-status"
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
