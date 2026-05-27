import { PracticeOverview } from '@/components/practice/PracticeOverview'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function PracticeOverviewPage() {
  const overviewQuery = usePracticeOverviewQuery()

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Practice Path"
          title="Guided practice"
          description="Short challenges for school topics, with hints and a place to ask when a step is unclear."
        />
        {overviewQuery.isLoading && <PageSkeleton rows={4} />}
        {overviewQuery.isError && <p className="text-sm text-destructive">Practice is unavailable right now.</p>}
        {overviewQuery.data && <PracticeOverview overview={overviewQuery.data} />}
      </PageContainer>
    </DashboardLayout>
  )
}
