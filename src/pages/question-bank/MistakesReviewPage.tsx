import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { QuestionBankFilters } from '@/components/question-bank/QuestionBankFilters'
import { Button } from '@/components/ui/button'
import { useQuestionBankMistakesQuery } from '@/hooks/questionBank/useQuestionBankMistakesQuery'
import { getQuestionBankSetPath, getQuestionBankSessionPath } from '@/lib/questionBankRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { QuestionBankFilters as QuestionBankFiltersValue } from '@/types/questionBank'

export function QuestionBankMistakesReviewPage() {
  const [filters, setFilters] = useState<QuestionBankFiltersValue>({
    subjectId: 'all',
    topicId: 'all',
    difficulty: 'all',
  })
  const mistakesQuery = useQuestionBankMistakesQuery(filters)
  const mistakes = mistakesQuery.data ?? []
  const firstSetId = mistakes[0]?.setId ?? 'linear-equations-basics'

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Question Bank"
          title="Mistakes Review"
          description="Rework missed or skipped questions from open practice sets."
        />
        <section className="grid gap-4 sm:grid-cols-3">
          <Metric label="Mistakes waiting" value={`${mistakes.length}`} />
          <Metric label="Subjects" value={`${new Set(mistakes.map((mistake) => mistake.subjectId)).size || 1}`} />
          <Metric label="Review mode" value="Low pressure" />
        </section>
        <QuestionBankFilters
          value={filters}
          onChange={setFilters}
          showLevel={false}
          showDifficulty
          showQuestionType={false}
          showStatus={false}
        />
        <section className="rounded-lg border bg-card/95 p-5 shadow-[var(--platform-shadow-soft)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="brand-section-kicker">Mistake Question List</p>
              <h2 className="mt-2 text-xl font-semibold">Review exactly where the answer changed</h2>
            </div>
            <Button asChild>
              <Link to={getQuestionBankSessionPath(`review-${firstSetId}`)}>
                <Play className="h-4 w-4" aria-hidden="true" />
                Start Review Session
              </Link>
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {mistakes.map((mistake) => (
              <article key={mistake.id} className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {mistake.subjectTitle} / {mistake.topicTitle}
                    </p>
                    <h3 className="mt-2 text-base font-semibold">{mistake.prompt}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Your answer: {mistake.studentAnswer}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Correct answer: {mistake.correctAnswer}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={getQuestionBankSetPath(mistake.setId)}>Open Set</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/90 p-4 shadow-[var(--platform-shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  )
}
