import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useRetentionOverviewQuery } from '@/hooks/admin/useRetentionOverviewQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function RetentionPage() {
  const retentionQuery = useRetentionOverviewQuery()

  useEffect(() => {
    trackEvent('retention_page_viewed')
  }, [])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Admin"
          title="Retention operations"
          description="Review inactive students and families who may benefit from follow-up."
        />
        {retentionQuery.data && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Inactive students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {retentionQuery.data.inactiveStudents.map((student) => (
                  <div key={student.id} className="rounded-md border p-4">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.riskReason}</p>
                    <p className="mt-2 text-sm">{student.suggestedAction}</p>
                    <Button className="mt-3" size="sm" variant="outline" onClick={() => toast.info('Reminder action is being prepared.')}>
                      Send reminder
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">At-risk families</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {retentionQuery.data.atRiskFamilies.map((family) => (
                  <div key={family.id} className="rounded-md border p-4">
                    <p className="font-medium">{family.familyName}</p>
                    <p className="text-sm text-muted-foreground">{family.riskReason}</p>
                    <p className="mt-2 text-sm">{family.suggestedAction}</p>
                    <Button className="mt-3" size="sm" variant="outline" onClick={() => toast.info('Follow-up task creation is being prepared.')}>
                      Create follow-up task
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
