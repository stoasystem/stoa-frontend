import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { getPracticeTopicPath } from '@/lib/practiceRoutes'
import { getQuestionBankMistakesPath, getQuestionBankSessionPath } from '@/lib/questionBankRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { QuestionBankResult } from '@/types/questionBank'

export function QuestionSetResultPage() {
  const { t } = useTranslation('practice')
  const { sessionId } = useParams()
  const location = useLocation()
  // A finished set is not stored anywhere, so the tally arrives from the
  // session that produced it rather than being reconstructed or invented.
  const result = (location.state as { result?: QuestionBankResult } | null)?.result ?? null

  if (result === null) {
    return (
      <DashboardLayout>
        <PageContainer className="space-y-6 p-0">
          <PageHeader
            eyebrow={t('ui.practiceComplete')}
            title={t('library.noFinishedSet')}
            description={t('library.resultHint')}
          />
          <Button asChild>
            <Link to="/question-bank">Back to Practice Library</Link>
          </Button>
        </PageContainer>
      </DashboardLayout>
    )
  }

  const accuracy = Math.round((result.score / result.total) * 100)
  const primaryTopic = result.accuracyByTopic[0]

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow={t('ui.practiceComplete')}
          title={t('ui.practiceComplete')}
          description={accuracy < 70 ? 'This set needs another round of practice. Review the questions below, then try a similar set.' : 'Use the result to decide whether to review mistakes, ask for an explanation, or continue the guided Practice Path.'}
        />
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Score" value={`${result.score} / ${result.total}`} />
          <Metric label="Accuracy" value={`${accuracy}%`} />
          <Metric label={t('ui.timeSpent')} value={`${result.timeSpentMinutes} min`} />
          <Metric label={t('ui.needsReview')} value={`${result.incorrectQuestions.length + result.skippedQuestions.length}`} />
        </section>
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-lg border bg-card/95 p-5 shadow-[var(--platform-shadow-soft)]">
              <p className="brand-section-kicker">What went well</p>
            <div className="mt-4 space-y-3">
              {result.accuracyByTopic.map((topic) => (
                <div key={topic.topicId}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{topic.topicTitle}</span>
                    <span className="text-muted-foreground">{topic.accuracy}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${topic.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="brand-section-kicker">{t('ui.needsReview')}</p>
              <div className="mt-3 space-y-3">
                {result.incorrectQuestions.map((mistake) => (
                  <div key={mistake.id} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
                    <p className="text-sm font-semibold">{mistake.prompt}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Correct answer: {mistake.correctAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border bg-card/95 p-5 shadow-[var(--platform-shadow-soft)]">
            <p className="brand-section-kicker">Next steps</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {result.nextSteps.map((step) => (
                  <li key={step}>- {step}</li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2">
                <Button asChild>
                  <Link to={getQuestionBankMistakesPath()}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Review Mistakes
                  </Link>
                </Button>
                {primaryTopic && (
                  <Button asChild variant="outline">
                    <Link to={getPracticeTopicPath('mathematics', primaryTopic.topicId)}>
                      Open Practice Path
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to={getQuestionBankSessionPath(sessionId ?? '')}>Practice Again</Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/90 p-4 shadow-[var(--platform-shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
