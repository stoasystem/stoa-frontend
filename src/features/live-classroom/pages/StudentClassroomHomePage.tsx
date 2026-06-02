import { CalendarPlus, MessageCircle, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { UpcomingClassroomCard } from '@/features/live-classroom/components/UpcomingClassroomCard'
import { useStudentClassroomHome } from '@/features/live-classroom/hooks/useStudentClassroomHome'
import { formatClassroomTimeRange } from '@/features/live-classroom/utils/formatClassroom'

export function StudentClassroomHomePage() {
  const homeQuery = useStudentClassroomHome()
  const home = homeQuery.data

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Live support"
          title="Online Classroom"
          description="Live tutor support when a question needs deeper step-by-step help."
        />

        {homeQuery.isLoading && <EmptyState message="Loading classroom sessions..." />}
        {homeQuery.isError && <ErrorState message="We could not load classroom sessions." />}

        {home && (
          <>
            {home.upcomingSession ? (
              <UpcomingClassroomCard session={home.upcomingSession} />
            ) : (
              <section className="rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
                    <Video className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="brand-section-kicker">No upcoming session</p>
                    <h2 className="mt-2 text-2xl font-semibold">Book live tutor help</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Choose a time for a focused classroom session, or start with the Learning Assistant
                      and request tutor support if you need help sooner.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild>
                        <Link to="/classroom/schedule">
                          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                          Schedule a Session
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/chat?intent=teacher-help">
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />
                          Ask Learning Assistant
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)]">
              <section className="rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
                <SectionHeader
                  title="Get Help Now"
                  description="Start with the Learning Assistant, request tutor support, then enter an Online Classroom if the question needs live help."
                />
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link to="/chat?intent=teacher-help">Ask Learning Assistant</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/classroom/schedule">Schedule a Session</Link>
                  </Button>
                </div>
              </section>

              <section className="rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
                <p className="brand-section-kicker">Session types</p>
                <div className="mt-4 grid gap-3">
                  {home.recommendedOptions.map((option) => (
                    <div key={option.id} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
                      <p className="text-sm font-semibold">{option.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="space-y-4">
              <SectionHeader
                title="Recent Sessions"
                description="Review previous live classroom support and next steps."
              />
              <div className="grid gap-3">
                {home.recentSessions.length === 0 && (
                  <EmptyState message="No completed classroom sessions yet." />
                )}
                {home.recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    to={`/classroom/sessions/${session.id}/summary`}
                    className="rounded-lg border bg-card p-4 shadow-[var(--platform-shadow-soft)] transition hover:border-primary/30"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{session.title}</p>
                        <p className="text-sm text-muted-foreground">{session.topicLabel ?? session.subjectLabel}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatClassroomTimeRange(session)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
