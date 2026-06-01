import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { QuestionBankFilters } from '@/components/question-bank/QuestionBankFilters'
import { QuestionSetCard } from '@/components/question-bank/QuestionSetCard'
import { Button } from '@/components/ui/button'
import { useQuestionBankTopicQuery } from '@/hooks/questionBank/useQuestionBankTopicQuery'
import { getPracticeTopicPath } from '@/lib/practiceRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { QuestionBankFilters as QuestionBankFiltersValue } from '@/types/questionBank'

export function TopicQuestionBankPage() {
  const { subjectId, topicId } = useParams()
  const [filters, setFilters] = useState<QuestionBankFiltersValue>({
    difficulty: 'all',
    questionType: 'all',
    status: 'all',
  })
  const topicQuery = useQuestionBankTopicQuery(subjectId, topicId, filters)

  if (topicQuery.isLoading) return <LoadingState />
  if (topicQuery.isError || !topicQuery.data) return <ErrorState message="Question Bank topic could not be loaded." />

  const { subject, topic, sets, weakAreas, progress } = topicQuery.data

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow={`${subject.title} / Question Bank`}
          title={topic.title}
          description={topic.description}
        />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-lg border bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
            <p className="brand-section-kicker">Your Progress</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric label="Completed" value={`${progress.completedSets} / ${progress.totalSets}`} />
              <Metric label="Accuracy" value={`${progress.accuracy}%`} />
              <Metric label="Weak area" value={topic.weakArea ?? 'Keep practising'} />
            </div>
          </div>
          <div className="rounded-lg border border-primary/15 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5">
            <p className="brand-section-kicker">Related Learning Path</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Follow the guided Practice Path when you want lesson progression for this topic.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to={getPracticeTopicPath(subject.id, topic.id)}>Open Practice Path</Link>
            </Button>
          </div>
        </section>
        <QuestionBankFilters
          value={filters}
          onChange={setFilters}
          showLevel={false}
          showDifficulty
          showQuestionType
          showStatus
        />
        <section className="space-y-4">
          <SectionHeader title="Question sets" description={`${sets.length} set${sets.length === 1 ? '' : 's'} match the current filters.`} />
          <div className="grid gap-4 lg:grid-cols-2">
            {sets.map((set) => (
              <QuestionSetCard key={set.id} set={set} />
            ))}
          </div>
        </section>
        <section className="rounded-lg border bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
          <p className="brand-section-kicker">Weak areas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {weakAreas.map((area) => (
              <span key={area} className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2 text-sm">
                {area}
              </span>
            ))}
          </div>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
