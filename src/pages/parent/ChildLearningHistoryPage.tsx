import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { useChildLearningHistoryQuery } from '@/hooks/parent/useChildLearningHistoryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ChildLearningHistoryPage() {
  const { t } = useTranslation('parent')
  const { childId } = useParams()
  const historyQuery = useChildLearningHistoryQuery(childId)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t('historyTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('history.description')}</p>
        </div>
        {historyQuery.isLoading && (
          <p className="text-sm text-muted-foreground">{t('history.loading')}</p>
        )}
        {historyQuery.isError && (
          <p className="text-sm text-destructive">{t('history.loadFailed')}</p>
        )}
        {historyQuery.data && <ChildLearningHistoryList items={historyQuery.data.items} />}
      </div>
    </DashboardLayout>
  )
}
