import { useMemo, useState } from 'react'
import { PracticeOverview } from '@/components/practice/PracticeOverview'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'
import { usePracticeRoadmapQuery } from '@/hooks/practice/usePracticeRoadmapQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { defaultPracticeTopicId } from '@/lib/practiceRoutes'

export function PracticeOverviewPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>()
  const overviewQuery = usePracticeOverviewQuery()
  const selectedTopicId = useMemo(() => {
    if (!selectedSubjectId) return undefined
    return overviewQuery.data?.topics.find((topic) => topic.subjectId === selectedSubjectId)?.id ?? defaultPracticeTopicId
  }, [overviewQuery.data?.topics, selectedSubjectId])
  const roadmapQuery = usePracticeRoadmapQuery(selectedSubjectId, selectedTopicId)

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
            onSubjectSelect={setSelectedSubjectId}
            overview={overviewQuery.data}
            roadmap={roadmapQuery.data}
            selectedSubjectId={selectedSubjectId}
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
