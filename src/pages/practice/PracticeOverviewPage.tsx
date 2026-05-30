import { PracticeOverview } from '@/components/practice/PracticeOverview'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'
import { usePracticeRoadmapQuery } from '@/hooks/practice/usePracticeRoadmapQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function PracticeOverviewPage() {
  const overviewQuery = usePracticeOverviewQuery()

  // Dynamically load roadmap for the recommended lesson's topic
  const recommendedSubject = overviewQuery.data?.recommendedLesson?.subjectId ?? 'mathematics'
  const recommendedTopic = overviewQuery.data?.recommendedLesson?.topicId ?? ''
  const roadmapQuery = usePracticeRoadmapQuery(
    recommendedSubject,
    recommendedTopic,
  )

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Practice Path"
          title="Guided practice"
          description="Short challenges for school topics, with hints and Learning Chat ready when a step is unclear."
        />
        {overviewQuery.isLoading && <PageSkeleton rows={4} />}
        {overviewQuery.isError && <p className="text-sm text-destructive">Practice is unavailable right now.</p>}
        {overviewQuery.data && (
          <PracticeOverview
            overview={overviewQuery.data}
            roadmap={recommendedTopic ? roadmapQuery.data : undefined}
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
