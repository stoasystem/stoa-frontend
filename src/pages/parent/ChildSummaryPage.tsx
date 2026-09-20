import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { ChildSummaryHeader } from '@/components/parent/ChildSummaryHeader'
import { LearningProfileSignals } from '@/components/learning/LearningProfileSignals'
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useChildLearningProfileQuery } from '@/hooks/parent/useChildLearningProfileQuery'
import { useChildLearningSummaryQuery } from '@/hooks/parent/useChildLearningSummaryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ChildSummaryPage() {
  const { t } = useTranslation('practice')
  const { t: tParent } = useTranslation('parent')
  const { childId } = useParams()
  const summaryQuery = useChildLearningSummaryQuery(childId)
  const learningProfileQuery = useChildLearningProfileQuery(childId)
  const curriculumQuery = useCurriculumCatalogQuery()
  const summary = summaryQuery.data
  const weakTopicLabels = learningProfileQuery.data?.weakTopics.map((topic) => topic.label) ?? summary?.weakTopics ?? []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs
            items={[
              { label: tParent('summary.breadcrumbRoot'), to: '/parent' },
              { label: summary?.student.name ?? tParent('childSummary') },
            ]}
          />
          <PageActions secondary={<BackButton label={tParent('summary.backLabel')} to="/parent" />} />
        </div>
        {summaryQuery.isLoading && <p className="text-sm text-muted-foreground">{tParent('summary.loading')}</p>}
        {summaryQuery.isError && <p className="text-sm text-destructive">{tParent('summary.loadFailed')}</p>}
        {summary && (
          <>
            <ChildSummaryHeader summary={summary} />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: tParent('summary.questionsAsked'),
                  value: String(summary.questionsAskedThisWeek),
                  description: tParent('summary.questionsAskedDescription'),
                },
                {
                  label: tParent('summary.aiResolved'),
                  value: String(summary.aiResolvedThisWeek),
                  description: tParent('summary.aiResolvedDescription'),
                },
                {
                  label: tParent('summary.practiceCompleted'),
                  value: String(summary.practiceLessonsCompletedThisWeek),
                  description: tParent('summary.practiceCompletedDescription'),
                },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <LearningProfileSignals
              title={tParent('summary.subjectProfile')}
              description={tParent('summary.subjectProfileDescription')}
              profile={learningProfileQuery.data}
              isLoading={learningProfileQuery.isLoading}
              isError={learningProfileQuery.isError}
            />
            <CurriculumRolloutPanel
              title={t('curriculumRollout.parentTitle')}
              description={t('curriculumRollout.parentDescription')}
              catalog={curriculumQuery.data}
              isLoading={curriculumQuery.isLoading}
              isError={curriculumQuery.isError}
              contextLabel={t('curriculumRollout.parentContext')}
              weakTopicLabels={weakTopicLabels}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{tParent('summary.weakTopics')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.weakTopics.length === 0 && (
                    <p className="text-sm text-muted-foreground">{tParent('summary.noWeakTopics')}</p>
                  )}
                  {summary.weakTopics.map((topic) => (
                    <p key={topic} className="text-sm">
                      {topic}
                    </p>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{tParent('summary.recentActivity')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground">{tParent('summary.noRecentActivity')}</p>
                  )}
                  {summary.recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-md border p-3">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-primary">
                        {activity.type.replace(/_/g, ' ')}
                      </p>
                      {activity.subject && (
                        <p className="mt-1 text-sm text-muted-foreground">{activity.subject}</p>
                      )}
                      <p className="mt-2 text-sm leading-6">{activity.summary}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tParent('summary.teacherHelp')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{summary.teacherHelpRequestsThisWeek}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tParent('summary.teacherHelpDescription')}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
