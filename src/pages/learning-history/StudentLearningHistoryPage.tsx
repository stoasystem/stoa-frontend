import type { TFunction } from 'i18next'
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
    ...(historyQuery.data?.items ?? []).map((item) => localizeHistoryItem(item, t)),
    ...getQuestionBankHistoryItems(questionBankOverviewQuery.data?.recentPractice ?? [], t),
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


/**
 * Classify a row from a backend that predates `source`.
 *
 * Only reached for rows without the field, where the label is still the
 * server's English one, so matching on it is safe here.
 */
function sourceFromLabel(sourceLabel: string | undefined) {
  const label = sourceLabel?.toLowerCase() ?? ''
  if (label.includes('classroom')) return 'classroom'
  if (label.includes('practice')) return 'practice_path'
  return 'questions'
}

/**
 * Render a server row's labels in the reader's language.
 *
 * The API sends English `title`/`sourceLabel` alongside a `kind`/`source` pair.
 * Where the pair is present it wins; the English text stays as the fallback for
 * a row shaped by an older backend.
 */
function localizeHistoryItem(item: LearningHistoryItem, t: TFunction<'practice'>): LearningHistoryItem {
  return {
    ...item,
    title: item.kind ? t(`progress.history.kinds.${item.kind}`) : item.title,
    sourceLabel: item.source ? t(`progress.history.sources.${item.source}`) : item.sourceLabel,
  }
}

function getQuestionBankHistoryItems(
  sets: QuestionBankSet[],
  t: TFunction<'practice'>,
): LearningHistoryItem[] {
  return sets.map((set) => ({
    id: `question-bank-history-${set.id}`,
    subject: t('progress.history.librarySubject'),
    title: set.title,
    summary: set.lastAttempt
      ? t('progress.history.libraryCompleted', {
          score: set.lastAttempt.score,
          total: set.lastAttempt.total,
          minutes: set.lastAttempt.timeSpentMinutes,
        })
      : t('progress.history.libraryInProgress', {
          answered: set.progress.answered,
          total: set.progress.total,
        }),
    createdAt: set.lastAttempt?.completedAt ?? new Date().toISOString(),
    href: getQuestionBankSetPath(set.id),
    sourceLabel: t('progress.history.sources.practice_library'),
    kind: 'library_set',
    source: 'practice_library',
  }))
}

/**
 * Split the rows into the sections the page shows.
 *
 * This used to sniff for the English words "practice path" and "practice
 * library" in the title and summary. Once those strings are translated the
 * match stops firing, so every practice row landed in the questions section
 * for anyone not reading the app in English. `source` says the same thing
 * without depending on the wording.
 */
function groupLearningHistoryItems(items: LearningHistoryItem[]) {
  return items.reduce(
    (groups, item) => {
      const source = item.source ?? sourceFromLabel(item.sourceLabel)

      if (source === 'classroom') {
        groups.classrooms.push(item)
      } else if (source === 'practice_path' || source === 'practice_library') {
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
