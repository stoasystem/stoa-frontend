import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DiagnosisSummaryCard } from '@/components/learning/DiagnosisSummaryCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useLearningDiagnosisQuery } from '@/hooks/learning/useLearningDiagnosisQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function WeakPointDiagnosisPage() {
  const { studentId = 'student-anna' } = useParams()
  const diagnosisQuery = useLearningDiagnosisQuery(studentId)

  useEffect(() => {
    trackEvent('weak_point_diagnosis_viewed', { studentId })
  }, [studentId])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Learning intelligence"
          title="Weak-point diagnosis"
          description="Demo diagnosis result. The frontend renders evidence and recommendations but does not run an AI diagnosis engine."
          actions={<Button asChild variant="outline"><Link to={`/students/${studentId}/curriculum-graph`}>View graph</Link></Button>}
        />
        {diagnosisQuery.data && (
          <>
            <DiagnosisSummaryCard diagnosis={diagnosisQuery.data} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Next steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {diagnosisQuery.data.nextSteps.map((step) => (
                    <p key={step} className="rounded-md border p-3 text-sm text-muted-foreground">{step}</p>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Parent and tutor context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>{diagnosisQuery.data.teacherHelpRecommendation}</p>
                  <p>{diagnosisQuery.data.parentExplanation}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
