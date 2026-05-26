import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { usePracticeMistakesQuery } from '@/hooks/practice/usePracticeMistakesQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function MistakesReviewPage() {
  const mistakesQuery = usePracticeMistakesQuery()

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Practice Path"
          title="Review mistakes"
          description="Return to recent practice steps with calm hints and retry actions."
        />
        {mistakesQuery.isLoading && <PageSkeleton rows={4} />}
        {mistakesQuery.isError && <p className="text-sm text-destructive">Mistakes are unavailable right now.</p>}
        {mistakesQuery.data && (
          <div className="space-y-4">
            {mistakesQuery.data.items.map((mistake) => (
              <MistakeReviewCard key={mistake.id} mistake={mistake} />
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
