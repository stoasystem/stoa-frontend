import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { BookMarked, CheckCircle2, Target } from 'lucide-react'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useParentChildProgressQuery } from '@/hooks/learning/useLearningOperationsQueries'
import { useChildLearningSummaryQuery } from '@/hooks/parent/useChildLearningSummaryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { getRecommendationRationale, getSubjectLabel, getTopicLabel } from '@/lib/displayLabels'
import type { LearningAssignment } from '@/types/learningOperations'

// The backend's reason is an English sentence; the same helpers as the
// student's assignment list put it, the subject and the topics in the
// parent's language, never as ids (#339).
function familyExplanation(assignment: LearningAssignment, t: TFunction) {
  const fallback = t('progress.defaultExplanation')
  const sentence = assignment.automation?.explanation || assignment.rationale
  return sentence ? getRecommendationRationale(sentence, t, fallback) : fallback
}

function familyTarget(assignment: LearningAssignment, t: TFunction) {
  const subject = assignment.subject ? getSubjectLabel(assignment.subject, t) : t('progress.subjectPending')
  const topics = assignment.topicIds.map((topicId) => getTopicLabel(topicId, t)).join(', ')
  return `${subject} / ${topics || t('progress.topicPending')}`
}

// The same statuses the student's assignment list names (practice namespace);
// anything else reads as "Status unavailable", never the raw code (#256).
const assignmentStatuses = new Set([
  'draft',
  'recommended',
  'assigned',
  'started',
  'completed',
  'skipped',
  'archived',
])

function statusLabel(status: string, t: TFunction<'practice'>) {
  if (assignmentStatuses.has(status)) return t(`assignments.status.${status}`)
  return t('assignments.status.unknown')
}

function FamilyAssignmentRow({ assignment }: { assignment: LearningAssignment }) {
  const { t } = useTranslation('parent')
  const { t: tPractice } = useTranslation('practice')

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{assignment.title || tPractice('assignments.untitled')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{familyTarget(assignment, t)}</p>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-semibold text-muted-foreground">{statusLabel(assignment.status, tPractice)}</span>
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
  // The same query the child page reads, so the name is usually cached already.
  const childName = useChildLearningSummaryQuery(childId).data?.student.name

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs
            items={[
              { label: t('dashboardTitle'), to: '/parent' },
              { label: childName || t('child'), to: childId ? `/parent/children/${childId}` : undefined },
              { label: t('progress.title') },
            ]}
          />
          <PageActions
            secondary={childId && <BackButton label={t('childSummary')} to={`/parent/children/${childId}`} />}
          />
        </div>
        <PageHeader
          eyebrow={childName || t('progress.eyebrow')}
          title={t('progress.title')}
          description={t('progress.description')}
        />

        {!childId && (
          <ErrorState title={t('progress.missingChild')} message={t('progress.missingChildMessage')} />
        )}
        {progressQuery.isLoading && <LoadingState message={t('progress.loading')} />}
        {progressQuery.error && (
          // The ApiError's own text is the backend's English (#256).
          <ErrorState title={t('progress.loadFailed')} message={t('progress.loadFailedMessage')} />
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
