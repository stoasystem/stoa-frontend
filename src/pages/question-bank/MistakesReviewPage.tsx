import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ReviewSession } from '@/components/practice/ReviewSession'
import { useReviewSummaryQuery } from '@/hooks/practice/useReviewQueries'

export function MistakesTab() {
  const { t } = useTranslation('practice')
  const summaryQuery = useReviewSummaryQuery()
  const summary = summaryQuery.data

  return (
    <PageContainer className="space-y-7 p-0">
      <PageHeader
        eyebrow={t('review.eyebrow')}
        title={t('review.title')}
        description={t('review.description')}
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          label={t('review.dueNow')}
          value={`${summary?.dueCount ?? 0}`}
          hint={t('review.dueNowHint')}
        />
        <Metric
          label={t('review.tracked')}
          value={`${summary?.scheduledCount ?? 0}`}
          hint={t('review.trackedHint')}
        />
        <Metric
          label={t('review.nextOne')}
          value={formatNextDue(summary?.nextDueAt, t)}
          hint={t('review.nextOneHint')}
        />
      </section>
      <ReviewSession />
    </PageContainer>
  )
}

function formatNextDue(dueAt: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!dueAt) {
    return t('review.none')
  }
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) {
    return t('review.none')
  }
  const days = Math.round((due.getTime() - Date.now()) / 86_400_000)
  if (days <= 0) {
    return t('review.today')
  }
  return days === 1 ? t('review.tomorrow') : t('review.inDays', { count: days })
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border bg-card/90 p-4 shadow-[var(--platform-shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      {/* A number, and a dash in particular, says nothing on its own. */}
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  )
}
