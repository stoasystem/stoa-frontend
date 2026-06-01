import { Link, useNavigate, useParams } from 'react-router-dom'
import { HelpCircle, Play, RotateCcw } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCreateQuestionBankSessionMutation } from '@/hooks/questionBank/useCreateQuestionBankSessionMutation'
import { useQuestionBankSetQuery } from '@/hooks/questionBank/useQuestionBankSetQuery'
import { getQuestionBankMistakesPath, getQuestionBankSessionPath } from '@/lib/questionBankRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function QuestionSetOverviewPage() {
  const { setId } = useParams()
  const navigate = useNavigate()
  const setQuery = useQuestionBankSetQuery(setId)
  const createSessionMutation = useCreateQuestionBankSessionMutation()

  if (setQuery.isLoading) return <LoadingState />
  if (setQuery.isError || !setQuery.data) return <ErrorState message="Question set could not be loaded." />

  const { set } = setQuery.data

  function startSession() {
    createSessionMutation.mutate(set.id, {
      onSuccess: (session) => navigate(getQuestionBankSessionPath(session.id)),
    })
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Question set"
          title={set.title}
          description={set.description}
        />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5 rounded-lg border bg-card/90 p-5 shadow-[var(--platform-shadow-card)]">
            <div className="grid gap-3 sm:grid-cols-4">
              <Meta label="Questions" value={`${set.questionCount}`} />
              <Meta label="Difficulty" value={set.difficultyRange} />
              <Meta label="Time" value={`${set.estimatedMinutes} min`} />
              <Meta label="Level" value={set.level.replace('-', ' ')} />
            </div>
            <div>
              <p className="brand-section-kicker">Skills Covered</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {set.skills.map((skill) => (
                  <li key={skill} className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2 text-sm">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="brand-section-kicker">Question Types</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {set.typeBreakdown.map((item) => (
                  <div key={item.type} className="flex items-center justify-between rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2 text-sm">
                    <span>{item.type.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
              <p className="brand-section-kicker">Your Last Attempt</p>
              {set.lastAttempt ? (
                <div className="mt-4 space-y-3">
                  <Meta label="Score" value={`${set.lastAttempt.score} / ${set.lastAttempt.total}`} />
                  <Meta label="Time" value={`${set.lastAttempt.timeSpentMinutes} min`} />
                  <Meta label="Mistakes" value={`${set.lastAttempt.mistakes}`} />
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">No attempt recorded yet. Start with a short, focused practice set.</p>
              )}
              <div className="mt-5 flex flex-col gap-2">
                <Button type="button" onClick={startSession} disabled={createSessionMutation.isPending}>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {set.status === 'in_progress' ? 'Resume Practice' : set.status === 'completed' ? 'Practice Again' : 'Start Practice'}
                </Button>
                {set.status === 'completed' || set.status === 'review_recommended' ? (
                  <Button asChild variant="outline">
                    <Link to={getQuestionBankMistakesPath()}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Review Mistakes
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="rounded-lg border border-primary/15 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Need help while practising?
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You can ask the Learning Assistant after each question and return to the set when the step is clearer.
              </p>
              <Badge variant="outline" className="mt-3">Question Bank + Learning Chat</Badge>
            </div>
          </aside>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  )
}
