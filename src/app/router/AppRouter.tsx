import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthBootstrap } from '@/app/router/AuthBootstrap'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleRoute } from '@/app/router/RoleRoute'
import { AdminDashboardPage } from '@/pages/admin/Dashboard'
import { ChatPage } from '@/pages/chat/ChatPage'
import { StudentDashboardPage } from '@/pages/dashboard/StudentDashboardPage'
import { ForbiddenPage } from '@/pages/error/ForbiddenPage'
import { UnauthorizedPage } from '@/pages/error/UnauthorizedPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { HomePage } from '@/pages/home/HomePage'
import { StudentLearningHistoryPage } from '@/pages/learning-history/StudentLearningHistoryPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { ChildLearningHistoryPage } from '@/pages/parent/ChildLearningHistoryPage'
import { ChildReportPage } from '@/pages/parent/ChildReportPage'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { StudentProfilePage } from '@/pages/profile/StudentProfilePage'
import { LoginPage } from '@/pages/login/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
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
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute />}>
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
            <Route path="/tutor/requests/:requestId" element={<TutorHelpRequestDetailPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
