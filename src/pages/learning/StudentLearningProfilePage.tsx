import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { LearningProfileHeader } from '@/components/learning/LearningProfileHeader'
import { StrongTopicList } from '@/components/learning/StrongTopicList'
import { WeakTopicList } from '@/components/learning/WeakTopicList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useLearningProfileQuery } from '@/hooks/learning/useLearningProfileQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function StudentLearningProfilePage() {
  const { studentId = 'student-anna' } = useParams()
  const profileQuery = useLearningProfileQuery(studentId)

  useEffect(() => {
    trackEvent('learning_profile_viewed', { studentId })
  }, [studentId])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Learning intelligence"
          title="Advanced learning profile"
          description="Learning profile view for reviewing progress patterns, topic history, and recommended next steps."
          actions={
            <PageActions
              primary={<Button asChild><Link to={`/students/${studentId}/diagnosis`}>Open diagnosis</Link></Button>}
              secondary={<BackButton label="Students" to="/organization/students" />}
            />
          }
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Organization', to: '/organization' },
            { label: 'Students', to: '/organization/students' },
            { label: profileQuery.data?.studentId ?? 'Learning profile' },
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
                  <CardTitle className="text-xl">Subject activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileQuery.data.subjectActivity.map((item) => (
                    <div key={item.subject} className="rounded-md border p-3">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.questionCount} questions · {item.aiResolvedCount} AI resolved · {item.teacherEscalationCount} tutor help
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Profile freshness</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Updated {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(profileQuery.data.updatedAt))}.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Parent report links</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/parent/children/${studentId}/monthly-report`}>Monthly report</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/organization/reports">Organization reports</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
