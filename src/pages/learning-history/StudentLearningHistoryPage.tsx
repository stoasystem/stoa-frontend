import { useTranslation } from 'react-i18next'
import { RecommendedPracticeCard } from '@/components/dashboard/RecommendedPracticeCard'
import { WeakTopicsCard } from '@/components/dashboard/WeakTopicsCard'
import { useRecommendationsQuery, useWeakTopicsQuery } from '@/hooks/learning/useWeakTopicsQuery'
import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useQuestionBankOverviewQuery } from '@/hooks/questionBank/useQuestionBankOverviewQuery'
import { useStudentLearningHistoryQuery } from '@/hooks/student/useStudentLearningHistoryQuery'
import { getQuestionBankSetPath } from '@/lib/questionBankRoutes'
import type { QuestionBankSet } from '@/types/questionBank'
import type { LearningHistoryItem } from '@/types/student'

export function ProgressTab() {
  const { t } = useTranslation('practice')
  const weakTopicsQuery = useWeakTopicsQuery()
  const recommendationsQuery = useRecommendationsQuery()
  const historyQuery = useStudentLearningHistoryQuery()
  const questionBankOverviewQuery = useQuestionBankOverviewQuery()
  const items = [
    ...(historyQuery.data?.items ?? []),
    ...getQuestionBankHistoryItems(questionBankOverviewQuery.data?.recentPractice ?? []),
  ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
  const groupedItems = groupLearningHistoryItems(items)

  return (
    <div className="space-y-6">
        {/* What to work on next, before the record of what was already done. */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <RecommendedPracticeCard
            recommendations={recommendationsQuery.recommendations}
            isLoading={recommendationsQuery.isLoading}
            isError={recommendationsQuery.isError}
          />
          <WeakTopicsCard
            topics={weakTopicsQuery.topics}
            isLoading={weakTopicsQuery.isLoading}
            isError={weakTopicsQuery.isError}
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{t('progress.historyTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('progress.historyBody')}
          </p>
        </div>
        {(historyQuery.isLoading || questionBankOverviewQuery.isLoading) && (
          <p className="text-sm text-muted-foreground">{t('progress.loadingHistory')}</p>
        )}
        {(historyQuery.isError || questionBankOverviewQuery.isError) && (
          <p className="text-sm text-destructive">{t('progress.historyFailed')}</p>
        )}
        {historyQuery.data && questionBankOverviewQuery.data && (
          <div className="space-y-7">
            <LearningHistorySection
              title={t('progress.questionHistory')}
              description={t('progress.questionHistoryBody')}
              emptyMessage={t('progress.questionHistoryEmpty')}
              items={groupedItems.questions}
            />
            <LearningHistorySection
              title={t('progress.practiceHistory')}
              description={t('progress.practiceHistoryBody')}
              emptyMessage={t('progress.practiceHistoryEmpty')}
              items={groupedItems.practice}
            />
          </div>
        )}
    </div>
  )
}

function LearningHistorySection({
  title,
  description,
  emptyMessage,
  items,
}: {
  title: string
  description: string
  emptyMessage: string
  items: LearningHistoryItem[]
}) {
  return (
    <section className="space-y-3">
      <SectionHeader title={title} description={description} />
      <ChildLearningHistoryList items={items} emptyMessage={emptyMessage} />
    </section>
  )
}


function getQuestionBankHistoryItems(sets: QuestionBankSet[]): LearningHistoryItem[] {
  return sets.map((set) => ({
    id: `question-bank-history-${set.id}`,
    subject: 'Library',
    title: set.title,
    summary: set.lastAttempt
      ? `Completed ${set.lastAttempt.score} of ${set.lastAttempt.total} questions in ${set.lastAttempt.timeSpentMinutes} minutes.`
      : `Answered ${set.progress.answered} of ${set.progress.total} questions. Continue this set from the Library.`,
    createdAt: set.lastAttempt?.completedAt ?? new Date().toISOString(),
    href: getQuestionBankSetPath(set.id),
    sourceLabel: 'Practice Library',
  }))
}

function groupLearningHistoryItems(items: LearningHistoryItem[]) {
  return items.reduce(
    (groups, item) => {
      const sourceLabel = item.sourceLabel?.toLowerCase() ?? ''
      const title = item.title.toLowerCase()
      const summary = item.summary.toLowerCase()

      if (sourceLabel.includes('classroom')) {
        groups.classrooms.push(item)
      } else if (
        sourceLabel.includes('practice') ||
        title.includes('practice path') ||
        title.includes('practice library') ||
        summary.includes('practice path') ||
        summary.includes('practice library')
      ) {
        groups.practice.push(item)
      } else {
        groups.questions.push(item)
      }

      return groups
    },
    {
      questions: [] as LearningHistoryItem[],
      classrooms: [] as LearningHistoryItem[],
      practice: [] as LearningHistoryItem[],
    },
  )
}
