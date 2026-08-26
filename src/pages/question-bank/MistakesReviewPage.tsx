import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ReviewSession } from '@/components/practice/ReviewSession'
import { useReviewSummaryQuery } from '@/hooks/practice/useReviewQueries'

export function MistakesTab() {
  const summaryQuery = useReviewSummaryQuery()
  const summary = summaryQuery.data

  return (
    <PageContainer className="space-y-7 p-0">
      <PageHeader
        eyebrow="Review"
        title="Questions coming back"
        description="Questions return just before they would be forgotten. Getting one right sends it further away; missing it brings it back."
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Due now" value={`${summary?.dueCount ?? 0}`} />
        <Metric label="Being tracked" value={`${summary?.scheduledCount ?? 0}`} />
        <Metric label="Next one" value={formatNextDue(summary?.nextDueAt)} />
      </section>
      <ReviewSession />
    </PageContainer>
  )
}

function formatNextDue(dueAt: string | undefined) {
  if (!dueAt) {
    return '—'
  }
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) {
    return '—'
  }
  const days = Math.round((due.getTime() - Date.now()) / 86_400_000)
  if (days <= 0) {
    return 'Today'
  }
  return days === 1 ? 'Tomorrow' : `In ${days} days`
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/90 p-4 shadow-[var(--platform-shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  )
}
