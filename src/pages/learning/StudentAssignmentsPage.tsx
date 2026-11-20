import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { AssignmentExplanationCard, assignmentLink } from '@/features/assignments/AssignmentExplanationCard'
import { useMyAssignmentsQuery } from '@/hooks/learning/useLearningOperationsQueries'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { toUserFacingError } from '@/lib/userFacingText'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StudentAssignmentsPage() {
  const { t } = useTranslation('practice')
  const assignmentsQuery = useMyAssignmentsQuery()
  const assignments = assignmentsQuery.data?.items ?? []
  // The chapter's own catalog read: opening one finds it already loaded.
  const catalog = useCurriculumCatalogQuery().data

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow={t('assignments.eyebrow')}
          title={t('assignments.title')}
          description={t('assignments.description')}
        />

        {assignmentsQuery.isLoading && <LoadingState message={t('assignments.loading')} />}
        {assignmentsQuery.error && (
          <ErrorState
            title={t('assignments.failed')}
            message={toUserFacingError(assignmentsQuery.error, t('assignments.failedBody'))}
          />
        )}
        {assignments.length === 0 && assignmentsQuery.isSuccess && (
          <Card>
            <CardContent className="pt-6">
              <EmptyState message={t('assignments.empty')} />
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 xl:grid-cols-2">
          {assignments.map((assignment) => (
            <AssignmentExplanationCard
              key={assignment.assignmentId}
              assignment={assignment}
              link={assignmentLink(assignment, catalog)}
            />
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
