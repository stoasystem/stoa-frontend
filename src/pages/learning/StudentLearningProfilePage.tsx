import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { LearningProfileHeader } from '@/components/learning/LearningProfileHeader'
import { StrongTopicList } from '@/components/learning/StrongTopicList'
import { WeakTopicList } from '@/components/learning/WeakTopicList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useLearningProfileQuery } from '@/hooks/learning/useLearningProfileQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { formatDayAndMonth } from '@/lib/formatDateTime'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function StudentLearningProfilePage() {
  const { t } = useTranslation('admin')
  const { studentId = 'student-anna' } = useParams()
  const profileQuery = useLearningProfileQuery(studentId)

  useEffect(() => {
    trackEvent('learning_profile_viewed', { studentId })
  }, [studentId])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow={t('learningProfile.eyebrow')}
          title={t('learningProfile.title')}
          description={t('learningProfile.description')}
          actions={
            // No diagnosis page and no organisation student list are registered (#25).
            <PageActions secondary={<BackButton label={t('learningProfile.organization')} to="/organization" />} />
          }
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: t('learningProfile.organization'), to: '/organization' },
            { label: t('learningProfile.students') },
            { label: profileQuery.data?.studentId ?? t('learningProfile.fallback') },
          ]}
        />
        {profileQuery.data && (
          <>
            <LearningProfileHeader profile={profileQuery.data} />
            <div className="grid gap-4 lg:grid-cols-2">
              <WeakTopicList topics={profileQuery.data.weakTopics} />
              <StrongTopicList topics={profileQuery.data.strengthTopics} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{t('learningProfile.subjectActivity')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileQuery.data.subjectActivity.map((item) => (
                    <div key={item.subject} className="rounded-md border p-3">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('learningProfile.activityLine', {
                          questions: item.questionCount,
                          aiResolved: item.aiResolvedCount,
                          teacherHelp: item.teacherEscalationCount,
                        })}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{t('learningProfile.freshness')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('learningProfile.updated', { date: formatDayAndMonth(profileQuery.data.updatedAt) })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
