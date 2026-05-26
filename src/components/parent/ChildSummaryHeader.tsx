import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { ChildLearningSummary } from '@/types/parent'

export function ChildSummaryHeader({ summary }: { summary: ChildLearningSummary }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{summary.student.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary.student.grade}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to={`/parent/children/${summary.student.id}/report`}>Weekly report</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/parent/children/${summary.student.id}/history`}>Learning history</Link>
        </Button>
      </div>
    </div>
  )
}
