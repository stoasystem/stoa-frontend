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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
          description="Choose today's learning action, then review progress and account access when needed."
        />

        <section className="space-y-4">
          <SectionHeader
            title="Today"
            description="Start with one clear action before looking through the rest of the learning record."
          />
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <ContinuePracticeCard />
              <AskQuestionCard />
            </div>
            <aside className="rounded-lg border border-border/70 bg-card/80 p-4 shadow-[var(--platform-shadow-card)]">
              <p className="brand-section-kicker">Weekly snapshot</p>
              <div className="mt-4 grid gap-3">
                {dashboardStats.map((stat) => (
                  <DashboardStatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Learning review"
            description="Switch between recent questions, subject progress, and teacher guidance."
          />
          <Tabs defaultValue="questions" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="support">Teacher</TabsTrigger>
            </TabsList>
            <TabsContent value="questions" className="mt-0">
              <RecentQuestionsCard questions={recentQuestions} />
            </TabsContent>
            <TabsContent value="progress" className="mt-0">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
                <LearningProgressCard progress={learningProgress} />
                <WeakTopicsCard topics={weakTopics} />
              </div>
            </TabsContent>
            <TabsContent value="support" className="mt-0">
              <TeacherFeedbackCard feedback={teacherFeedback} />
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Account and access"
            description="Usage quota and family plan visibility for this student account."
          />
          <StudentPlanAccessSection />
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}
