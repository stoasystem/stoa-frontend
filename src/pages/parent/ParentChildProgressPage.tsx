import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { BookMarked, CheckCircle2, Target } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useParentChildProgressQuery } from '@/hooks/learning/useLearningOperationsQueries'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { LearningAssignment } from '@/types/learningOperations'

function familyExplanation(assignment: LearningAssignment, t: TFunction) {
  return assignment.automation?.explanation
    || assignment.rationale
    || t('progress.defaultExplanation')
}

function FamilyAssignmentRow({ assignment }: { assignment: LearningAssignment }) {
  const { t } = useTranslation('parent')

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{assignment.title || assignment.assignmentId}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignment.subject || t('progress.subjectPending')} / {assignment.topicIds.join(', ') || t('progress.topicPending')}
          </p>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-semibold text-muted-foreground">{assignment.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{familyExplanation(assignment, t)}</p>
    </div>
  )
}

export function ParentChildProgressPage() {
  const { t } = useTranslation('parent')
  const { childId } = useParams()
  const progressQuery = useParentChildProgressQuery(childId ?? '')
  const progress = progressQuery.data

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow={t('progress.eyebrow')}
          title={t('progress.title')}
          description={t('progress.description')}
        />

        {!childId && (
          <ErrorState title={t('progress.missingChild')} message={t('progress.missingChildMessage')} />
        )}
        {progressQuery.isLoading && <LoadingState message={t('progress.loading')} />}
        {progressQuery.error && (
          <ErrorState title={t('progress.loadFailed')} message={progressQuery.error.message} />
        )}

        {progress && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="flex items-center gap-2 text-2xl font-semibold"><BookMarked className="h-5 w-5" /> {progress.assignedPracticeCount}</p>
                  <p className="text-sm text-muted-foreground">{t('progress.assignedPractice')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="flex items-center gap-2 text-2xl font-semibold"><CheckCircle2 className="h-5 w-5" /> {progress.completedPracticeCount}</p>
                  <p className="text-sm text-muted-foreground">{t('progress.completedPractice')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="flex items-center gap-2 text-2xl font-semibold"><Target className="h-5 w-5" /> {progress.weakAreas.length}</p>
                  <p className="text-sm text-muted-foreground">{t('progress.focusAreas')}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('progress.activeAssignments')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress.assignments.length === 0 && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    {t('progress.noActiveAssignments')}
                  </p>
                )}
                {progress.assignments.map((assignment) => (
                  <FamilyAssignmentRow key={assignment.assignmentId} assignment={assignment} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('progress.recentlyCompleted')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress.completedAssignments.length === 0 && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    {t('progress.noCompleted')}
                  </p>
                )}
                {progress.completedAssignments.map((assignment) => (
                  <FamilyAssignmentRow key={assignment.assignmentId} assignment={assignment} />
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
