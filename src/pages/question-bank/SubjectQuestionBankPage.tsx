import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { QuestionBankFilters } from '@/components/question-bank/QuestionBankFilters'
import { QuestionSetCard } from '@/components/question-bank/QuestionSetCard'
import { TopicCard } from '@/components/question-bank/SubjectTopicCards'
import { useQuestionBankSubjectQuery } from '@/hooks/questionBank/useQuestionBankSubjectQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { QuestionBankFilters as QuestionBankFiltersValue } from '@/types/questionBank'

export function SubjectQuestionBankPage() {
  const { t } = useTranslation('practice')
  const { subjectId } = useParams()
  const subjectQuery = useQuestionBankSubjectQuery(subjectId)
  const [filters, setFilters] = useState<QuestionBankFiltersValue>({ level: 'all', difficulty: 'all' })

  if (subjectQuery.isLoading) return <LoadingState message={t('library.loadingSets')} />
  if (subjectQuery.isError || !subjectQuery.data) return <ErrorState title={t('library.subjectFailed')} message={t('library.returnHint')} />

  const { subject, topics, recommendedSets, progress } = subjectQuery.data
  const filteredTopics = topics.filter((topic) => !filters.level || filters.level === 'all' || topic.levelTags.includes(filters.level))

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow={t('ui.practiceLibrary')}
          title={subject.title}
          description={t('library.subjectSubtitle')}
        />
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label={t('ui.setsCompleted')} value={`${progress.completedSets}`} />
          <Metric label={t('ui.questionsAnswered')} value={`${progress.answeredQuestions}`} />
          <Metric label="Accuracy" value={`${progress.accuracy}%`} />
        </section>
        <QuestionBankFilters value={filters} onChange={setFilters} showQuestionType={false} showStatus={false} />
        <section className="space-y-4">
          <SectionHeader title="Topics" description={t('ui.openTopicHint')} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <SectionHeader title={t('ui.recommendedSets')} description={t('library.nextSets')} />
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendedSets.map((set) => (
              <QuestionSetCard key={set.id} set={set} />
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
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
