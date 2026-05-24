import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { useStudentLearningHistoryQuery } from '@/hooks/student/useStudentLearningHistoryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StudentLearningHistoryPage() {
  const historyQuery = useStudentLearningHistoryQuery()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learning History</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review the learning summaries saved for your account.
          </p>
        </div>
        {historyQuery.isLoading && <p className="text-sm text-muted-foreground">Loading history...</p>}
        {historyQuery.isError && <p className="text-sm text-destructive">Failed to load history.</p>}
        {historyQuery.data && <ChildLearningHistoryList items={historyQuery.data.items} />}
      </div>
    </DashboardLayout>
  )
}
