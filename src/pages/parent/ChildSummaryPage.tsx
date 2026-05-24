import { useParams } from 'react-router-dom'
import { ChildSummaryHeader } from '@/components/parent/ChildSummaryHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChildLearningSummaryQuery } from '@/hooks/parent/useChildLearningSummaryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ChildSummaryPage() {
  const { childId } = useParams()
  const summaryQuery = useChildLearningSummaryQuery(childId)
  const summary = summaryQuery.data

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {summaryQuery.isLoading && <p className="text-sm text-muted-foreground">Loading child summary...</p>}
        {summaryQuery.isError && <p className="text-sm text-destructive">Failed to load child summary.</p>}
        {summary && (
          <>
            <ChildSummaryHeader summary={summary} />
            <div className="grid gap-4 md:grid-cols-3">
              {summary.stats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weak topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.weakTopics.map((topic) => (
                    <p key={topic.id} className="text-sm">
                      {topic.subject}: {topic.topic} ({topic.level})
                    </p>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.recentQuestions.map((question) => (
                    <p key={question.id} className="text-sm">
                      {question.subject}: {question.title}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teacher help records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.teacherHelpRecords.map((record) => (
                  <p key={record.id} className="text-sm">
                    {record.subject}: {record.status}
                  </p>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
