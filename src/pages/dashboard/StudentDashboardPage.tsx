import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { LearningProgressCard } from '@/components/dashboard/LearningProgressCard'
import { RecentQuestionsCard } from '@/components/dashboard/RecentQuestionsCard'
import { TeacherFeedbackCard } from '@/components/dashboard/TeacherFeedbackCard'
import { WeakTopicsCard } from '@/components/dashboard/WeakTopicsCard'
import {
  dashboardStats,
  learningProgress,
  recentQuestions,
  teacherFeedback,
  weakTopics,
} from '@/data/mockDashboard'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StudentDashboardPage() {
  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          title="Student Dashboard"
          description="Track learning progress, recent questions, weak topics, and teacher feedback."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {dashboardStats.map((stat) => (
            <DashboardStatCard key={stat.label} stat={stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentQuestionsCard questions={recentQuestions} />
          <WeakTopicsCard topics={weakTopics} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <LearningProgressCard progress={learningProgress} />
          <TeacherFeedbackCard feedback={teacherFeedback} />
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
