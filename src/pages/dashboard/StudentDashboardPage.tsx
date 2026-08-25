import { Camera, GraduationCap, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { AskQuestionCard } from '@/components/dashboard/AskQuestionCard'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { ContinuePracticeCard } from '@/components/dashboard/ContinuePracticeCard'
import { ClassroomDashboardCard } from '@/features/live-classroom/components/ClassroomDashboardCard'
import { LearningProgressCard } from '@/components/dashboard/LearningProgressCard'
import { RecentQuestionsCard } from '@/components/dashboard/RecentQuestionsCard'
import { QuestionBankCard } from '@/components/dashboard/QuestionBankCard'
import { RecommendedPracticeCard } from '@/components/dashboard/RecommendedPracticeCard'
import { StudentPlanAccessSection } from '@/components/dashboard/StudentPlanAccessSection'
import { WeakTopicsCard } from '@/components/dashboard/WeakTopicsCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useCurriculumProgressQuery } from '@/hooks/practice/useCurriculumProgressQuery'
import { useStudentLearningHistoryQuery } from '@/hooks/student/useStudentLearningHistoryQuery'
import { useRecommendationsQuery, useWeakTopicsQuery } from '@/hooks/learning/useWeakTopicsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { DashboardStat, LearningProgress, RecentQuestion } from '@/types/dashboard'

export function StudentDashboardPage() {
  // Both hooks share one query key, so this is a single network request.
  const weakTopicsQuery = useWeakTopicsQuery()
  const recommendationsQuery = useRecommendationsQuery()
  const progressQuery = useCurriculumProgressQuery()
  const historyQuery = useStudentLearningHistoryQuery()

  const progress = progressQuery.data
  const historyItems = historyQuery.data?.items ?? []
  const catalogQuery = useCurriculumCatalogQuery()
  const recentQuestions: RecentQuestion[] = historyItems.slice(0, 5).map((item) => ({
    id: item.id,
    subject: item.subject,
    title: item.summary || item.title,
    createdAt: item.createdAt,
    status: item.title === 'Teacher help requested' ? 'teacher_helped' : 'answered_by_ai',
  }))
  const totalLessons = catalogQuery.data?.lessons.length ?? 0
  const learningProgress: LearningProgress[] =
    totalLessons === 0
      ? []
      : [
          {
            id: 'lessons',
            subject: catalogQuery.data?.subjects[0]?.name ?? 'Practice',
            completed: progress?.completedLessons ?? 0,
            target: totalLessons,
            description: 'Lessons completed in the Practice Path and Library',
          },
        ]
  const weeklySnapshot: DashboardStat[] = [
    {
      label: 'Study streak',
      value: `${progress?.studyStreak ?? 0} ${progress?.studyStreak === 1 ? 'day' : 'days'}`,
      description: progress?.practisedToday ? 'Practised today' : 'Not practised today yet',
    },
    {
      label: 'Lessons completed',
      value: `${progress?.completedLessons ?? 0}`,
      description: 'Across the Practice Path and Library',
    },
    {
      label: 'Mistakes to review',
      value: `${progress?.mistakeCount ?? 0}`,
      description: 'Questions worth another look',
    },
  ]

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Learning space"
          title="Welcome back"
          description="Continue learning where you left off, then choose practice, guidance, or live support when you need it."
        />

        <section className="space-y-4">
          <SectionHeader
            title="Continue Learning"
            description="Start with the guided Practice Path before choosing extra practice or support."
          />
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <ContinuePracticeCard />
            <aside className="rounded-lg border border-border/70 bg-card/80 p-4 shadow-[var(--platform-shadow-card)]">
              <p className="brand-section-kicker">Weekly snapshot</p>
              <div className="mt-4 grid gap-3">
                {weeklySnapshot.map((stat) => (
                  <DashboardStatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Need Help?"
            description="Ask for guidance or upload a schoolwork question when a step is unclear."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <AskQuestionCard />
            <UploadQuestionCard />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Today's Practice"
            description="Choose targeted exercises or review questions you missed before."
          />
          <RecommendedPracticeCard
            recommendations={recommendationsQuery.recommendations}
            isLoading={recommendationsQuery.isLoading}
            isError={recommendationsQuery.isError}
          />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <QuestionBankCard />
            <MistakesReviewCard />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Live Support"
            description="Use tutor support and Online Classroom after the assistant is not enough."
          />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ClassroomDashboardCard />
            <TutorSupportCard />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Recent Activity"
            description="Review recent questions and subject progress."
          />
          <Tabs defaultValue="questions" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>
            <TabsContent value="questions" className="mt-0">
              <RecentQuestionsCard questions={recentQuestions} />
            </TabsContent>
            <TabsContent value="progress" className="mt-0">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
                <LearningProgressCard progress={learningProgress} />
                <WeakTopicsCard
                  topics={weakTopicsQuery.topics}
                  isLoading={weakTopicsQuery.isLoading}
                  isError={weakTopicsQuery.isError}
                />
              </div>
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

function UploadQuestionCard() {
  return (
    <Card className="h-full border-primary/15 bg-card/95 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Upload a Question</p>
            <CardTitle className="text-xl">Bring schoolwork into STOA</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Take a photo or attach a PDF from schoolwork. The Learning Assistant can help you understand it step by step.
        </p>
        <Button asChild variant="outline">
          <Link to="/question-bank">
            Upload a Question
            <Camera className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function MistakesReviewCard() {
  return (
    <Card className="h-full border-border/70 bg-card/95 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Review & Improve</p>
            <CardTitle className="text-xl">Mistakes to Review</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Review questions you missed before and strengthen your understanding.
        </p>
        <Button asChild variant="outline">
          <Link to="/question-bank/mistakes">Review Mistakes</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function TutorSupportCard() {
  return (
    <Card className="h-full border-border/70 bg-card/95 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Tutor Support</p>
            <CardTitle className="text-xl">Ask a tutor when you need more help</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Start with the Learning Assistant. If the explanation still feels unclear, a tutor can join the same learning context.
        </p>
        <Button asChild variant="outline">
          <Link to="/chat?intent=teacher-help">Ask a Tutor</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
