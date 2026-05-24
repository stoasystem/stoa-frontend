import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ParentReportSubject, ParentReportWeakTopic } from '@/types/parentReport'

export function ParentReportSubjects({
  subjects,
  weakTopics,
}: {
  subjects: ParentReportSubject[]
  weakTopics: ParentReportWeakTopic[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.length === 0 && (
            <p className="text-sm text-muted-foreground">No subject activity is available yet.</p>
          )}
          {subjects.map((subject) => (
            <div key={subject.id} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-medium">{subject.name}</h2>
                <Badge variant="outline">{subject.progressLabel}</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{subject.summary}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{subject.questionsAnswered} questions answered</span>
                <span>{subject.teacherHelpCount} teacher help sessions</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weak topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weakTopics.length === 0 && (
            <p className="text-sm text-muted-foreground">No weak topics were flagged this week.</p>
          )}
          {weakTopics.map((topic) => (
            <div key={topic.id} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-medium">
                  {topic.subject}: {topic.topic}
                </h2>
                <Badge variant={topic.level === 'high' ? 'destructive' : 'secondary'}>
                  {topic.level}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{topic.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
