import { CalendarClock, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useTutorClassroomQueue } from '@/features/live-classroom/hooks/useTutorClassroomQueue'
import type { LiveClassroomSession } from '@/features/live-classroom/types/liveClassroom'
import {
  formatClassroomTimeRange,
  getClassroomStatusLabel,
} from '@/features/live-classroom/utils/formatClassroom'

export function TutorClassroomQueuePage() {
  const queueQuery = useTutorClassroomQueue()
  const queue = queueQuery.data

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Tutor classroom"
          title="Classroom Queue"
          description="Review scheduled classrooms and live support requests before joining."
        />

        {queueQuery.isLoading && <EmptyState message="Loading classroom queue..." />}
        {queueQuery.isError && <ErrorState message="We could not load the classroom queue." />}

        {queue && (
          <>
            <section className="space-y-4">
              <SectionHeader title="Starting Soon" description="Scheduled sessions ready for lobby review." />
              <SessionList sessions={queue.startingSoon} empty="No scheduled sessions are starting soon." />
            </section>
            <section className="space-y-4">
              <SectionHeader title="Live Support Requests" description="Students waiting for deeper live help." />
              <SessionList sessions={queue.instantRequests} empty="No live support requests are waiting." instant />
            </section>
            <section className="space-y-4">
              <SectionHeader title="Completed Today" description="Recent sessions with notes and next steps." />
              <SessionList sessions={queue.completedToday} empty="No completed classroom sessions today." summary />
            </section>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function SessionList({
  sessions,
  empty,
  instant = false,
  summary = false,
}: {
  sessions: LiveClassroomSession[]
  empty: string
  instant?: boolean
  summary?: boolean
}) {
  if (sessions.length === 0) {
    return <EmptyState message={empty} />
  }

  return (
    <div className="grid gap-4">
      {sessions.map((session) => (
        <article key={session.id} className="rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                {instant ? <Video className="h-4 w-4 text-primary" aria-hidden="true" /> : <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />}
                <p className="brand-section-kicker">{instant ? 'Live support request' : 'Classroom session'}</p>
              </div>
              <h2 className="mt-2 text-xl font-semibold">{session.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{formatClassroomTimeRange(session)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Student: {session.studentName} · Topic: {session.topicLabel ?? session.subjectLabel}
              </p>
              {session.context?.summary && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{session.context.summary}</p>
              )}
              <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-2">
                  <dt className="font-semibold text-foreground">Source</dt>
                  <dd className="mt-1">{session.context?.sourceLabel ?? 'Classroom request'}</dd>
                </div>
                <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-2">
                  <dt className="font-semibold text-foreground">Material</dt>
                  <dd className="mt-1">{session.materials.length > 0 ? `${session.materials.length} attached` : 'No material yet'}</dd>
                </div>
                <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-2">
                  <dt className="font-semibold text-foreground">Suggested focus</dt>
                  <dd className="mt-1">{session.recommendedFocus ?? 'Review the question step by step.'}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2 text-sm font-medium">
                {getClassroomStatusLabel(session.status)}
              </span>
              <Button asChild>
                <Link to={summary
                  ? `/tutor/classroom/sessions/${session.id}/summary`
                  : `/tutor/classroom/sessions/${session.id}/lobby`}
                >
                  {summary ? 'View Summary' : instant ? 'Review Context' : 'Open Lobby'}
                </Link>
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
