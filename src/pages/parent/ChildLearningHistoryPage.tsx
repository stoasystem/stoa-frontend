import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { useChildLearningHistoryQuery } from '@/hooks/parent/useChildLearningHistoryQuery'
import { useChildLearningSummaryQuery } from '@/hooks/parent/useChildLearningSummaryQuery'
import { useReportsTrail } from '@/hooks/parent/useReportsTrail'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ChildLearningHistoryPage() {
  const { t } = useTranslation('parent')
  const { childId } = useParams()
  const historyQuery = useChildLearningHistoryQuery(childId)
  // The same query the child page reads, so the name is usually cached already.
  const childName = useChildLearningSummaryQuery(childId).data?.student.name
  // Reached from the child's summary only, so Back stays the summary, on the
  // trail it was opened on (Reports', #411).
  const { root, keep } = useReportsTrail()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs
            items={[
              root({ label: t('dashboardTitle'), to: '/parent' }),
              { label: childName || t('child'), to: childId ? keep(`/parent/children/${childId}`) : undefined },
              { label: t('summary.learningHistoryLink') },
            ]}
          />
          <PageActions
            secondary={childId && <BackButton label={t('childSummary')} to={keep(`/parent/children/${childId}`)} />}
          />
        </div>
        <div>
          {childName && <p className="text-sm text-muted-foreground">{childName}</p>}
          <h1 className="text-2xl font-semibold">{t('historyTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('history.description')}</p>
        </div>
        {historyQuery.isLoading && (
          <p role="status" className="text-sm text-muted-foreground">{t('history.loading')}</p>
        )}
        {historyQuery.isError && (
          <p role="alert" className="text-sm text-destructive">{t('history.loadFailed')}</p>
        )}
        {historyQuery.data && <ChildLearningHistoryList items={historyQuery.data.items} />}
      </div>
    </DashboardLayout>
  )
}
