import { CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStudentClassroomHome } from '@/features/live-classroom/hooks/useStudentClassroomHome'
import { formatClassroomTimeRange } from '@/features/live-classroom/utils/formatClassroom'

export function ParentClassroomVisibilityCard() {
  const homeQuery = useStudentClassroomHome()
  const upcoming = homeQuery.data?.upcomingSession
  const recent = homeQuery.data?.recentSessions[0]

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Online Classroom</p>
            <CardTitle className="text-xl">Classroom visibility</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          See lightweight information about upcoming and recent live tutor sessions. Your child joins from
          the student dashboard. Parent observer, recording, and attendance controls are not part of this view.
        </p>
        {upcoming && (
          <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</p>
            <p className="mt-1 text-sm font-medium">{upcoming.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatClassroomTimeRange(upcoming)}</p>
          </div>
        )}
        {recent && (
          <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent</p>
            <p className="mt-1 text-sm font-medium">{recent.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{recent.topicLabel ?? recent.subjectLabel}</p>
          </div>
        )}
        <Button asChild variant="outline" size="sm">
          <Link to="/parent/reports">View learning reports</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
