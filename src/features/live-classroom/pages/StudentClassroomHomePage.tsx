import { CalendarPlus, MessageCircle, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useStudentClassroomHome } from '@/features/live-classroom/hooks/useStudentClassroomHome'

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
            <section className="rounded-lg border bg-card shadow-[var(--platform-shadow-card)]">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
                      <Video className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="brand-section-kicker">
                        {home.upcomingSession ? 'Next classroom' : 'No upcoming session'}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        {home.upcomingSession ? home.upcomingSession.title : 'Book live tutor help'}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Online Classroom is the focused live step after Learning Assistant guidance or tutor text support.
                        Bring the question, materials, and goal into one short tutoring workspace.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button asChild>
                          <Link to={home.upcomingSession ? `/classroom/sessions/${home.upcomingSession.id}/lobby` : '/classroom/schedule'}>
                            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                            {home.upcomingSession ? 'Open Lobby' : 'Schedule a Session'}
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link to="/chat?intent=teacher-help">
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            Ask Learning Assistant
                          </Link>
                        </Button>
                        {home.upcomingSession && (
                          <Button asChild variant="outline">
                            <Link to="/classroom/schedule">Schedule another</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t bg-[hsl(var(--platform-surface-app))] p-5 lg:border-l lg:border-t-0">
                  <p className="brand-section-kicker">How it works</p>
                  <ol className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                    <li><span className="font-semibold text-foreground">1.</span> Start from the question.</li>
                    <li><span className="font-semibold text-foreground">2.</span> Add materials and context.</li>
                    <li><span className="font-semibold text-foreground">3.</span> Join a focused live session.</li>
                  </ol>
                </div>
              </div>
            </section>

          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
