import { useParams } from 'react-router-dom'
import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { useChildLearningHistoryQuery } from '@/hooks/parent/useChildLearningHistoryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ChildLearningHistoryPage() {
  const { childId } = useParams()
  const historyQuery = useChildLearningHistoryQuery(childId)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Child Learning History</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Parent-visible summaries only. Student chat participation remains student-owned.
          </p>
        </div>
        {historyQuery.isLoading && <p className="text-sm text-muted-foreground">Loading history...</p>}
        {historyQuery.isError && <p className="text-sm text-destructive">Failed to load history.</p>}
        {historyQuery.data && <ChildLearningHistoryList items={historyQuery.data.items} />}
      </div>
    </DashboardLayout>
  )
}
