import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard'
import { LearningProgressCard } from '@/components/dashboard/LearningProgressCard'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
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
          eyebrow="Learning space"
          title="Student Dashboard"
          description="Choose the next learning step: continue guided practice, ask a specific question, or review recent activity."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {dashboardStats.map((stat) => (
            <DashboardStatCard key={stat.label} stat={stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <NextActionCard />
          <ContinueLearningCard />
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
