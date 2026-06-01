import { MessageCircle, RotateCcw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useClassroomSession } from '@/features/live-classroom/hooks/useClassroomSession'
import { formatClassroomTimeRange } from '@/features/live-classroom/utils/formatClassroom'

export function ClassroomSummaryPage({ tutorMode = false }: { tutorMode?: boolean }) {
  const { sessionId } = useParams()
  const sessionQuery = useClassroomSession(sessionId)
  const session = sessionQuery.data

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow="Classroom Summary"
          title={session?.title ?? 'Classroom Summary'}
          description={session ? formatClassroomTimeRange(session) : 'Review notes and next steps.'}
        />

        {sessionQuery.isLoading && <EmptyState message="Loading classroom summary..." />}
        {sessionQuery.isError && <ErrorState message="We could not load this classroom summary." />}

        {session && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
              <p className="brand-section-kicker">Session Notes</p>
              <h2 className="mt-2 text-2xl font-semibold">{session.topicLabel ?? session.subjectLabel}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {session.notes?.summary ?? 'The tutor will add notes after the session.'}
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold">Key explanation</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {(session.notes?.keyPoints ?? []).map((point) => (
                      <li key={point}>- {point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Next steps</h3>
                  <div className="mt-3 grid gap-2">
                    {(session.notes?.nextSteps ?? []).map((nextStep) => (
                      <Button key={nextStep.id} asChild variant="outline" size="sm">
                        <Link to={nextStep.targetUrl ?? '/dashboard'}>{nextStep.label}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              {!tutorMode && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link to="/chat">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Back to Learning Chat
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/practice">
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Practice similar questions
                    </Link>
                  </Button>
                </div>
              )}
            </section>

            <aside className="rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
              <p className="brand-section-kicker">Materials</p>
              <div className="mt-4 grid gap-3">
                {session.materials.map((material) => (
                  <div key={material.id} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
                    <p className="text-sm font-medium">{material.title}</p>
                    <p className="mt-1 text-xs uppercase text-muted-foreground">{material.type}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
