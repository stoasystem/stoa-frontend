import { CalendarClock, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStudentClassroomHome } from '@/features/live-classroom/hooks/useStudentClassroomHome'
import { formatClassroomTimeRange } from '@/features/live-classroom/utils/formatClassroom'

export function ClassroomDashboardCard() {
  const homeQuery = useStudentClassroomHome()
  const upcoming = homeQuery.data?.upcomingSession

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <Video className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Online Classroom</p>
            <CardTitle className="text-xl">
              {upcoming ? 'Next live support session' : 'Book live tutor help'}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming ? (
          <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
            <p className="text-sm font-semibold">{upcoming.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatClassroomTimeRange(upcoming)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tutor: {upcoming.tutorName ?? 'Tutor to be confirmed'}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Schedule a live classroom when you need deeper help with a question or topic.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {upcoming && (
            <Button asChild>
              <Link to={`/classroom/sessions/${upcoming.id}/lobby`}>
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Join Lobby
              </Link>
            </Button>
          )}
          <Button asChild variant={upcoming ? 'outline' : 'default'}>
            <Link to="/classroom/schedule">Schedule a Session</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/chat?intent=teacher-help">Request Instant Help</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
