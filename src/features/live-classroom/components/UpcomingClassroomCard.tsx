import { CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { LiveClassroomSession } from '@/features/live-classroom/types/liveClassroom'
import {
  formatClassroomTimeRange,
  getClassroomStatusLabel,
} from '@/features/live-classroom/utils/formatClassroom'

export function UpcomingClassroomCard({ session }: { session: LiveClassroomSession }) {
  return (
    <article className="rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="brand-section-kicker">Upcoming Session</p>
          <h2 className="mt-2 text-2xl font-semibold">{session.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{formatClassroomTimeRange(session)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tutor: {session.tutorName ?? 'Tutor to be confirmed'} · {session.topicLabel ?? session.subjectLabel}
          </p>
        </div>
        <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2 text-sm font-medium">
          {getClassroomStatusLabel(session.status)}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link to={`/classroom/sessions/${session.id}/lobby`}>
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Join Lobby
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/classroom/schedule">Schedule another</Link>
        </Button>
      </div>
    </article>
  )
}
