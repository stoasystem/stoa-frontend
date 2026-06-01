import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QuestionSetCard } from '@/components/question-bank/QuestionSetCard'
import { useQuestionBankSavedSetsQuery } from '@/hooks/questionBank/useQuestionBankSavedSetsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function SavedQuestionSetsPage() {
  const savedQuery = useQuestionBankSavedSetsQuery()
  const sets = savedQuery.data ?? []

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Question Bank"
          title="Saved Question Sets"
          description="Keep useful open-practice sets close for quick review."
        />
        <section className="space-y-4">
          <SectionHeader title="Saved sets" description={`${sets.length} set${sets.length === 1 ? '' : 's'} saved for later practice.`} />
          <div className="grid gap-4 lg:grid-cols-2">
            {sets.map((set) => (
              <QuestionSetCard key={set.id} set={set} />
            ))}
          </div>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}
