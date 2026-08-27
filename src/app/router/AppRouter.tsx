import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { AuthBootstrap } from "@/app/router/AuthBootstrap";
import { RoleSwitcher } from "@/components/dev/RoleSwitcher";
import { DemoSurfaceRoute } from "@/app/router/DemoSurfaceRoute";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { RoleRoute } from "@/app/router/RoleRoute";
import { ChatSkeleton } from "@/components/chat/ChatSkeleton";

const AdminAccountOperationsPage = lazy(() =>
  import("@/pages/admin/AdminAccountOperationsPage").then((m) => ({
    default: m.AdminAccountOperationsPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/Dashboard").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminCurriculumPage = lazy(() =>
  import("@/pages/admin/AdminCurriculumPage").then((m) => ({
    default: m.AdminCurriculumPage,
  })),
);
const AdminModerationPage = lazy(() =>
  import("@/pages/admin/AdminModerationPage").then((m) => ({
    default: m.AdminModerationPage,
  })),
);
const AdminOperationsPlaceholderPage = lazy(() =>
  import("@/pages/admin/OperationsPlaceholder").then((m) => ({
    default: m.AdminOperationsPlaceholderPage,
  })),
);
const AdminSubscriptionRequestsPage = lazy(() =>
  import("@/pages/admin/AdminSubscriptionRequestsPage").then((m) => ({
    default: m.AdminSubscriptionRequestsPage,
  })),
);
const AdminBillingCheckoutPage = lazy(() =>
  import("@/pages/admin/AdminBillingCheckoutPage").then((m) => ({
    default: m.AdminBillingCheckoutPage,
  })),
);
const BillingPage = lazy(() =>
  import("@/pages/billing/BillingPage").then((m) => ({
    default: m.BillingPage,
  })),
);
const CheckoutResultPage = lazy(() =>
  import("@/pages/billing/CheckoutResultPage").then((m) => ({
    default: m.CheckoutResultPage,
  })),
);
const PaymentSettingsPage = lazy(() =>
  import("@/pages/billing/PaymentSettingsPage").then((m) => ({
    default: m.PaymentSettingsPage,
  })),
);
const VirtualCheckoutPage = lazy(() =>
  import("@/pages/billing/VirtualCheckoutPage").then((m) => ({
    default: m.VirtualCheckoutPage,
  })),
);
const ClassroomLobbyPage = lazy(() =>
  import("@/features/live-classroom/pages/ClassroomLobbyPage").then((m) => ({
    default: m.ClassroomLobbyPage,
  })),
);
const ClassroomRoomPage = lazy(() =>
  import("@/features/live-classroom/pages/ClassroomRoomPage").then((m) => ({
    default: m.ClassroomRoomPage,
  })),
);
const ClassroomSummaryPage = lazy(() =>
  import("@/features/live-classroom/pages/ClassroomSummaryPage").then((m) => ({
    default: m.ClassroomSummaryPage,
  })),
);
const ScheduleClassroomPage = lazy(() =>
  import("@/features/live-classroom/pages/ScheduleClassroomPage").then((m) => ({
    default: m.ScheduleClassroomPage,
  })),
);
const StudentClassroomHomePage = lazy(() =>
  import("@/features/live-classroom/pages/StudentClassroomHomePage").then(
    (m) => ({ default: m.StudentClassroomHomePage }),
  ),
);
const TutorClassroomQueuePage = lazy(() =>
  import("@/features/live-classroom/pages/TutorClassroomQueuePage").then(
    (m) => ({ default: m.TutorClassroomQueuePage }),
  ),
);
const ForbiddenPage = lazy(() =>
  import("@/pages/error/ForbiddenPage").then((m) => ({
    default: m.ForbiddenPage,
  })),
);
const UnauthorizedPage = lazy(() =>
  import("@/pages/error/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const LearningAutomationConsolePage = lazy(() =>
  import("@/pages/learning/LearningAutomationConsolePage").then((m) => ({
    default: m.LearningAutomationConsolePage,
  })),
);
const LearningOperationsDashboardPage = lazy(() =>
  import("@/pages/learning/LearningOperationsDashboardPage").then((m) => ({
    default: m.LearningOperationsDashboardPage,
  })),
);
const StudentLearningProfilePage = lazy(() =>
  import("@/pages/learning/StudentLearningProfilePage").then((m) => ({
    default: m.StudentLearningProfilePage,
  })),
);
const StudentAssignmentsPage = lazy(() =>
  import("@/pages/learning/StudentAssignmentsPage").then((m) => ({
    default: m.StudentAssignmentsPage,
  })),
);
const PrivacyPage = lazy(() =>
  import("@/pages/legal/PrivacyPage").then((m) => ({ default: m.PrivacyPage })),
);
const TermsPage = lazy(() =>
  import("@/pages/legal/TermsPage").then((m) => ({ default: m.TermsPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/not-found/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);
const OnboardingPage = lazy(() =>
  import("@/pages/onboarding/OnboardingPage").then((m) => ({
    default: m.OnboardingPage,
  })),
);
const ChildLearningHistoryPage = lazy(() =>
  import("@/pages/parent/ChildLearningHistoryPage").then((m) => ({
    default: m.ChildLearningHistoryPage,
  })),
);
const ParentAccountOperationsPage = lazy(() =>
  import("@/pages/parent/ParentAccountOperationsPage").then((m) => ({
    default: m.ParentAccountOperationsPage,
  })),
);
const ParentChildProgressPage = lazy(() =>
  import("@/pages/parent/ParentChildProgressPage").then((m) => ({
    default: m.ParentChildProgressPage,
  })),
);
const ChildReportPage = lazy(() =>
  import("@/pages/parent/ChildReportPage").then((m) => ({
    default: m.ChildReportPage,
  })),
);
const ChildSummaryPage = lazy(() =>
  import("@/pages/parent/ChildSummaryPage").then((m) => ({
    default: m.ChildSummaryPage,
  })),
);
const ParentDashboardPage = lazy(() =>
  import("@/pages/parent/ParentDashboardPage").then((m) => ({
    default: m.ParentDashboardPage,
  })),
);
const ParentReportsPage = lazy(() =>
  import("@/pages/parent/ParentReportsPage").then((m) => ({
    default: m.ParentReportsPage,
  })),
);
const QuestionSessionPage = lazy(() =>
  import("@/pages/question-bank/QuestionSessionPage").then((m) => ({
    default: m.QuestionSessionPage,
  })),
);
const QuestionSetOverviewPage = lazy(() =>
  import("@/pages/question-bank/QuestionSetOverviewPage").then((m) => ({
    default: m.QuestionSetOverviewPage,
  })),
);
const QuestionSetResultPage = lazy(() =>
  import("@/pages/question-bank/QuestionSetResultPage").then((m) => ({
    default: m.QuestionSetResultPage,
  })),
);
const SavedQuestionSetsPage = lazy(() =>
  import("@/pages/question-bank/SavedQuestionSetsPage").then((m) => ({
    default: m.SavedQuestionSetsPage,
  })),
);
const SubjectQuestionBankPage = lazy(() =>
  import("@/pages/question-bank/SubjectQuestionBankPage").then((m) => ({
    default: m.SubjectQuestionBankPage,
  })),
);
const TopicQuestionBankPage = lazy(() =>
  import("@/pages/question-bank/TopicQuestionBankPage").then((m) => ({
    default: m.TopicQuestionBankPage,
  })),
);
const LessonPage = lazy(() =>
  import("@/pages/practice/LessonPage").then((m) => ({
    default: m.LessonPage,
  })),
);
const LessonResultPage = lazy(() =>
  import("@/pages/practice/LessonResultPage").then((m) => ({
    default: m.LessonResultPage,
  })),
);
const SubjectPathPage = lazy(() =>
  import("@/pages/practice/SubjectPathPage").then((m) => ({
    default: m.SubjectPathPage,
  })),
);
const TopicRoadmapPage = lazy(() =>
  import("@/pages/practice/TopicRoadmapPage").then((m) => ({
    default: m.TopicRoadmapPage,
  })),
);
const StudentProfilePage = lazy(() =>
  import("@/pages/profile/StudentProfilePage").then((m) => ({
    default: m.StudentProfilePage,
  })),
);
const EntryPage = lazy(() =>
  import("@/pages/entry/EntryPage").then((m) => ({ default: m.EntryPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const TeacherActivatePage = lazy(() =>
  import("@/pages/auth/TeacherActivatePage").then((m) => ({
    default: m.TeacherActivatePage,
  })),
);
const AdminTeacherApplicationsPage = lazy(() =>
  import("@/pages/admin/AdminTeacherApplicationsPage").then((m) => ({
    default: m.AdminTeacherApplicationsPage,
  })),
);
const SupportPage = lazy(() =>
  import("@/pages/support/SupportPage").then((m) => ({
    default: m.SupportPage,
  })),
);
const TutorAvailabilityPage = lazy(() =>
  import("@/pages/tutor/TutorAvailabilityPage").then((m) => ({
    default: m.TutorAvailabilityPage,
  })),
);
const TutorDashboardPage = lazy(() =>
  import("@/pages/tutor/TutorDashboardPage").then((m) => ({
    default: m.TutorDashboardPage,
  })),
);
const TutorHelpRequestDetailPage = lazy(() =>
  import("@/pages/tutor/TutorHelpRequestDetailPage").then((m) => ({
    default: m.TutorHelpRequestDetailPage,
  })),
);
const TutorProfilePage = lazy(() =>
  import("@/pages/tutor/TutorProfilePage").then((m) => ({
    default: m.TutorProfilePage,
  })),
);

// Heavy pages are code-split so the initial bundle stays small.
// Each has a matching skeleton fallback so users see a layout instantly.
const LearnPage = lazy(() =>
  import("@/pages/learn/LearnPage").then((m) => ({ default: m.LearnPage })),
);
const ChatPage = lazy(() =>
  import("@/pages/chat/ChatPage").then((m) => ({ default: m.ChatPage })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <RoleSwitcher />
      {/* Every page is loaded on demand, so one boundary covers them all.
          The two routes with their own skeleton keep it. */}
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/login" element={<EntryPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/teacher-activate" element={<TeacherActivatePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/assistant" element={<Navigate replace to="/chat" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/billing" element={<BillingPage />} />
            <Route
              path="/billing/payment-settings"
              element={<PaymentSettingsPage />}
            />
            <Route
              path="/billing/checkout/result"
              element={<CheckoutResultPage />}
            />
            <Route
              path="/billing/checkout/demo"
              element={<VirtualCheckoutPage />}
            />
            <Route element={<RoleRoute allowedRoles={["student"]} />}>
              {/* The day now starts in the conversation, with the streak and
                  the unfinished lesson carried into it. */}
              <Route path="/dashboard" element={<Navigate replace to="/chat" />} />
              <Route
                path="/chat"
                element={
                  <Suspense fallback={<ChatSkeleton />}>
                    <ChatPage />
                  </Suspense>
                }
              />
              <Route path="/classroom" element={<StudentClassroomHomePage />} />
              <Route
                path="/classroom/schedule"
                element={<ScheduleClassroomPage />}
              />
              <Route
                path="/classroom/sessions/:sessionId/lobby"
                element={<ClassroomLobbyPage />}
              />
              <Route
                path="/classroom/sessions/:sessionId/room"
                element={<ClassroomRoomPage />}
              />
              <Route
                path="/classroom/sessions/:sessionId/summary"
                element={<ClassroomSummaryPage />}
              />
              {/* One place to practise. The old entries still resolve so
                  links and bookmarks keep working. */}
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/learn/:tab" element={<LearnPage />} />
              <Route
                path="/practice"
                element={<Navigate replace to="/learn/path" />}
              />
              <Route path="/assignments" element={<StudentAssignmentsPage />} />
              <Route
                path="/practice/mistakes"
                element={<Navigate replace to="/learn/mistakes" />}
              />
              <Route
                path="/question-bank"
                element={<Navigate replace to="/learn" />}
              />
              <Route
                path="/question-bank/mistakes"
                element={<Navigate replace to="/learn/mistakes" />}
              />
              <Route
                path="/question-bank/saved"
                element={<SavedQuestionSetsPage />}
              />
              <Route
                path="/question-bank/sets/:setId"
                element={<QuestionSetOverviewPage />}
              />
              <Route
                path="/question-bank/session/:sessionId"
                element={<QuestionSessionPage />}
              />
              <Route
                path="/question-bank/session/:sessionId/result"
                element={<QuestionSetResultPage />}
              />
              <Route
                path="/question-bank/:subjectId/:topicId"
                element={<TopicQuestionBankPage />}
              />
              <Route
                path="/question-bank/:subjectId"
                element={<SubjectQuestionBankPage />}
              />
              <Route
                path="/practice/:subjectId/:topicId"
                element={<TopicRoadmapPage />}
              />
              <Route
                path="/practice/:subjectId/:topicId/lessons/:lessonId"
                element={<LessonPage />}
              />
              <Route
                path="/practice/:subjectId/:topicId/lessons/:lessonId/result"
                element={<LessonResultPage />}
              />
              <Route
                path="/practice/:subjectId"
                element={<SubjectPathPage />}
              />
              <Route
                path="/practice/:subjectId/lessons/:lessonId"
                element={<LessonPage />}
              />
              <Route
                path="/practice/:subjectId/lessons/:lessonId/result"
                element={<LessonResultPage />}
              />
              <Route path="/profile" element={<StudentProfilePage />} />
              <Route
                path="/learning-history"
                element={<Navigate replace to="/learn/progress" />}
                />
            </Route>
            <Route element={<RoleRoute allowedRoles={["parent"]} />}>
              <Route path="/parent" element={<ParentDashboardPage />} />
              <Route
                path="/parent/account-operations"
                element={<ParentAccountOperationsPage />}
              />
              <Route path="/parent/reports" element={<ParentReportsPage />} />
              <Route
                path="/parent/children/:childId"
                element={<ChildSummaryPage />}
              />
              <Route
                path="/parent/children/:childId/progress"
                element={<ParentChildProgressPage />}
              />
              <Route
                path="/parent/children/:childId/report"
                element={<ChildReportPage />}
              />
              <Route
                path="/parent/children/:childId/history"
                element={<ChildLearningHistoryPage />}
              />
            </Route>
            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "organization_admin",
                    "school_teacher",
                    "school_viewer",
                  ]}
                />
              }
            >
              <Route
                path="/organization/learning-operations"
                element={<LearningOperationsDashboardPage />}
              />
              <Route
                path="/organization/students/:studentId/learning-profile"
                element={
                  <DemoSurfaceRoute>
                    <StudentLearningProfilePage />
                  </DemoSurfaceRoute>
                }
              />
              <Route
                path="/organization/learning-automation"
                element={<LearningAutomationConsolePage />}
              />
              <Route
                path="/students/:studentId/learning-profile"
                element={
                  <DemoSurfaceRoute>
                    <StudentLearningProfilePage />
                  </DemoSurfaceRoute>
                }
              />
            </Route>
            <Route element={<RoleRoute allowedRoles={["teacher"]} />}>
              <Route path="/tutor" element={<TutorDashboardPage />} />
              <Route
                path="/tutor/classroom"
                element={<TutorClassroomQueuePage />}
              />
              <Route
                path="/tutor/classroom/sessions/:sessionId/lobby"
                element={<ClassroomLobbyPage tutorMode />}
              />
              <Route
                path="/tutor/classroom/sessions/:sessionId/room"
                element={<ClassroomRoomPage tutorMode />}
              />
              <Route
                path="/tutor/classroom/sessions/:sessionId/summary"
                element={<ClassroomSummaryPage tutorMode />}
              />
              <Route
                path="/tutor/availability"
                element={<TutorAvailabilityPage />}
              />
              <Route
                path="/tutor/learning-automation"
                element={<LearningAutomationConsolePage />}
              />
              <Route path="/tutor/profile" element={<TutorProfilePage />} />
              <Route
                path="/tutor/requests/:requestId"
                element={<TutorHelpRequestDetailPage />}
              />
            </Route>
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route
                path="/admin/learning-operations"
                element={<LearningOperationsDashboardPage />}
              />
              <Route
                path="/admin/moderation"
                element={<AdminModerationPage />}
              />
              <Route
                path="/admin/learning-automation"
                element={<LearningAutomationConsolePage />}
              />
              <Route
                path="/admin/subscriptions"
                element={<AdminSubscriptionRequestsPage />}
              />
              <Route
                path="/admin/curriculum"
                element={<AdminCurriculumPage />}
              />
              <Route
                path="/admin/account-operations"
                element={<AdminAccountOperationsPage />}
              />
              <Route
                path="/admin/teacher-applications"
                element={<AdminTeacherApplicationsPage />}
              />
              <Route
                path="/admin/users"
                element={<AdminOperationsPlaceholderPage title="Users" />}
              />
              <Route
                path="/admin/billing-interest"
                element={
                  <AdminOperationsPlaceholderPage title="Billing interest" />
                }
              />
              <Route
                path="/admin/billing/checkout-recovery"
                element={<AdminBillingCheckoutPage />}
              />
              <Route
                path="/admin/system"
                element={
                  <AdminOperationsPlaceholderPage title="System status" />
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
