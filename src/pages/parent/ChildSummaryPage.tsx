import type { TFunction } from 'i18next'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { ChildSummaryHeader } from '@/components/parent/ChildSummaryHeader'
import { getActivityTypeLabel } from '@/components/parent/activityLabels'
import { LearningProfileSignals } from '@/components/learning/LearningProfileSignals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChildLearningProfileQuery } from '@/hooks/parent/useChildLearningProfileQuery'
import { useChildLearningSummaryQuery } from '@/hooks/parent/useChildLearningSummaryQuery'
import { useReportsTrail } from '@/hooks/parent/useReportsTrail'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { getSubjectLabel, getTopicLabel } from '@/lib/displayLabels'
import type { LearningProfile } from '@/types/learningProfile'
import type { ChildLearningSummary } from '@/types/parent'

/**
 * A weak topic as a parent reads it. The summary's list mixes topic ids,
 * subject ids and free-text knowledge points ("linear-equations", "math",
 * "Brüche"); a subject reads as its name, an id as words, prose as sent (#339).
 */
function readableTopic(value: string, t: TFunction) {
  const subject = getSubjectLabel(value, t)
  if (subject !== value) return subject
  if (/\s/.test(value.trim())) return value.trim()
  return getTopicLabel(value, t)
}

// The learning profile's labelled topics first; the summary's ids only when
// the profile has none to give.
function weakTopicLabels(profile: LearningProfile | undefined, summary: ChildLearningSummary, t: TFunction) {
  const source = profile && profile.weakTopics.length > 0
    ? profile.weakTopics.map((topic) => topic.label || topic.topicId)
    : summary.weakTopics
  return [...new Set(source.map((value) => readableTopic(value, t)).filter(Boolean))]
}

export function ChildSummaryPage() {
  const { t: tParent } = useTranslation('parent')
  const { childId } = useParams()
  const summaryQuery = useChildLearningSummaryQuery(childId)
  const learningProfileQuery = useChildLearningProfileQuery(childId)
  const summary = summaryQuery.data
  const weakTopics = summary ? weakTopicLabels(learningProfileQuery.data, summary, tParent) : []
  // Opened from Reports, it leads back there (#411).
  const trail = useReportsTrail()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs
            items={[
              trail.root({ label: tParent('summary.breadcrumbRoot'), to: '/parent' }),
              { label: summary?.student.name ?? tParent('childSummary') },
            ]}
          />
          <PageActions secondary={<BackButton {...trail.back({ label: tParent('summary.backLabel'), to: '/parent' })} />} />
        </div>
        {/* The page keeps a heading while the child loads or fails to (#339). */}
        {!summary && <h1 className="text-2xl font-semibold">{tParent('childSummary')}</h1>}
        {summaryQuery.isLoading && (
          <p role="status" className="text-sm text-muted-foreground">{tParent('summary.loading')}</p>
        )}
        {summaryQuery.isError && (
          <p role="alert" className="text-sm text-destructive">{tParent('summary.loadFailed')}</p>
        )}
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
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{tParent('summary.weakTopics')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {weakTopics.length === 0 && (
                    <p className="text-sm text-muted-foreground">{tParent('summary.noWeakTopics')}</p>
                  )}
                  {weakTopics.map((topic) => (
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
                        {getActivityTypeLabel(activity.type, tParent)}
                      </p>
                      {activity.subject && (
                        <p className="mt-1 text-sm text-muted-foreground">{getSubjectLabel(activity.subject, tParent)}</p>
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
