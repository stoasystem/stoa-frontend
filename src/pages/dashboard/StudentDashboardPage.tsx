import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { AskQuestionCard } from '@/components/dashboard/AskQuestionCard'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { ContinuePracticeCard } from '@/components/dashboard/ContinuePracticeCard'
import { LearningProgressCard } from '@/components/dashboard/LearningProgressCard'
import { RecentQuestionsCard } from '@/components/dashboard/RecentQuestionsCard'
import { StudentPlanAccessSection } from '@/components/dashboard/StudentPlanAccessSection'
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
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Learning space"
          title="Student Dashboard"
          description="Choose the next learning step: continue guided practice, ask a specific question, or review recent activity."
        />

        <section aria-label="Learning summary" className="grid grid-cols-3 gap-2 sm:gap-3">
          {dashboardStats.map((stat) => (
            <DashboardStatCard key={stat.label} stat={stat} />
          ))}
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Plan and access"
            description="Usage quota and family plan visibility for this student account."
          />
          <StudentPlanAccessSection />
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Next learning step"
            description="Start with independent practice, then open an explanation when a step is unclear."
          />
          <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]">
            <ContinuePracticeCard />
            <AskQuestionCard />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Learning review"
            description="Recent activity, progress signals, and teacher guidance in one calmer review area."
          />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
            <div className="grid gap-5">
              <RecentQuestionsCard questions={recentQuestions} />
              <TeacherFeedbackCard feedback={teacherFeedback} />
            </div>

            <div className="grid gap-5">
              <LearningProgressCard progress={learningProgress} />
              <WeakTopicsCard topics={weakTopics} />
            </div>
          </div>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}
