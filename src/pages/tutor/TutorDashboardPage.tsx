import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { HelpRequestList } from '@/components/tutor/HelpRequestList'
import { TutorDashboardSkeleton } from '@/components/tutor/TutorDashboardSkeleton'
import { TutorStatsCards } from '@/components/tutor/TutorStatsCards'
import {
  TutorRequestFilters,
  type TutorRequestFilter,
} from '@/components/tutor/TutorRequestFilters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTutorHelpRequestsQuery } from '@/hooks/tutor/useTutorHelpRequestsQuery'
import { useTutorStatsQuery } from '@/hooks/tutor/useTutorStatsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function TutorDashboardPage() {
  const { t } = useTranslation('tutor')
  const requestsQuery = useTutorHelpRequestsQuery()
  const statsQuery = useTutorStatsQuery()
  const [filter, setFilter] = useState<TutorRequestFilter>('all')
  const requests = requestsQuery.data?.items ?? []
  const filteredRequests = useMemo(
    () => (filter === 'all' ? requests : requests.filter((request) => request.status === filter)),
    [filter, requests],
  )

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          title={t('dashboardTitle')}
          description={t('dashboardDescription')}
        />
        {requestsQuery.isLoading && <TutorDashboardSkeleton showHeader={false} />}
        {requestsQuery.isError && <p className="text-sm text-destructive">{t('loadRequestsFailed')}</p>}
        {requestsQuery.data && (
          <div className="space-y-4">
            <Card className="border-primary/15 bg-card/95">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
                    <Video className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="brand-section-kicker">Online Classroom</p>
                    <CardTitle className="text-xl">Live classroom queue</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Review scheduled classroom sessions and instant video requests with student context.
                </p>
                <Button asChild>
                  <Link to="/tutor/classroom">Open Classroom Queue</Link>
                </Button>
              </CardContent>
            </Card>
            <TutorStatsCards stats={statsQuery.data} />
            <TutorRequestFilters value={filter} onChange={setFilter} />
            <HelpRequestList requests={filteredRequests} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
