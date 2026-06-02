import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useStudentClassroomHome } from '@/features/live-classroom/hooks/useStudentClassroomHome'
import { useQuestionBankOverviewQuery } from '@/hooks/questionBank/useQuestionBankOverviewQuery'
import { useStudentLearningHistoryQuery } from '@/hooks/student/useStudentLearningHistoryQuery'
import { getQuestionBankSetPath } from '@/lib/questionBankRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { QuestionBankSet } from '@/types/questionBank'
import type { LearningHistoryItem } from '@/types/student'

export function StudentLearningHistoryPage() {
  const historyQuery = useStudentLearningHistoryQuery()
  const classroomQuery = useStudentClassroomHome()
  const questionBankOverviewQuery = useQuestionBankOverviewQuery()
  const items = [
    ...(historyQuery.data?.items ?? []),
    ...getClassroomHistoryItems(classroomQuery.data?.recentSessions ?? []),
    ...getQuestionBankHistoryItems(questionBankOverviewQuery.data?.recentPractice ?? []),
  ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
  const groupedItems = groupLearningHistoryItems(items)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Learning History</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review the learning summaries saved for your account.
          </p>
        </div>
        {(historyQuery.isLoading || classroomQuery.isLoading || questionBankOverviewQuery.isLoading) && (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        )}
        {(historyQuery.isError || classroomQuery.isError || questionBankOverviewQuery.isError) && (
          <p className="text-sm text-destructive">Failed to load history.</p>
        )}
        {historyQuery.data && classroomQuery.data && questionBankOverviewQuery.data && (
          <div className="space-y-7">
            <LearningHistorySection
              title="Question history"
              description="Questions, explanations, and Learning Assistant support records."
              emptyMessage="No question history is available yet."
              items={groupedItems.questions}
            />
            <LearningHistorySection
              title="Online classroom history"
              description="Completed live classroom sessions and their summaries."
              emptyMessage="No completed classroom sessions are available yet."
              items={groupedItems.classrooms}
            />
            <LearningHistorySection
              title="Practice history"
              description="Practice Path and Practice Library learning records."
              emptyMessage="No practice history is available yet."
              items={groupedItems.practice}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
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

function getClassroomHistoryItems(
  sessions: NonNullable<ReturnType<typeof useStudentClassroomHome>['data']>['recentSessions'],
): LearningHistoryItem[] {
  return sessions.map((session) => ({
    id: `classroom-history-${session.id}`,
    subject: session.topicLabel ?? session.subjectLabel,
    title: session.title,
    summary: session.notes?.summary ?? session.context?.summary ?? 'Completed an Online Classroom session.',
    createdAt: session.endedAt ?? session.scheduledEndAt ?? session.scheduledStartAt ?? new Date().toISOString(),
    href: `/classroom/sessions/${session.id}/summary`,
    sourceLabel: 'Online Classroom',
  }))
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
