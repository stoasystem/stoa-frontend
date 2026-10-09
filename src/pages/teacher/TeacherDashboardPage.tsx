import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Group, Row } from '@/components/base'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { HelpRequestList } from '@/components/teacher/HelpRequestList'
import { TeacherDashboardSkeleton } from '@/components/teacher/TeacherDashboardSkeleton'
import { TeacherStatsCards } from '@/components/teacher/TeacherStatsCards'
import {
  TeacherRequestFilters,
  type TeacherRequestFilter,
} from '@/components/teacher/TeacherRequestFilters'
/* Card 020: used only by the classroom queue card, withdrawn below.
import { Link } from 'react-router-dom'
import { Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
*/
import { useTeacherHelpRequestsQuery } from '@/hooks/teacher/useTeacherHelpRequestsQuery'
import { useTeacherStatsQuery } from '@/hooks/teacher/useTeacherStatsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function TeacherDashboardPage() {
  const { t } = useTranslation('teacher')
  const requestsQuery = useTeacherHelpRequestsQuery()
  const statsQuery = useTeacherStatsQuery()
  const [filter, setFilter] = useState<TeacherRequestFilter>('all')
  const requests = requestsQuery.data?.items ?? []
  const filteredRequests = useMemo(
    () => (filter === 'all' ? requests : requests.filter((request) => request.status === filter)),
    [filter, requests],
  )

  return (
    <DashboardLayout>
      <PageContainer className="max-w-[920px] p-0">
        <PageHeader
          title={t('dashboardTitle')}
          description={t('dashboardDescription')}
        />
        {requestsQuery.isLoading && <TeacherDashboardSkeleton showHeader={false} />}
        {requestsQuery.isError && <p className="text-sm text-red">{t('loadRequestsFailed')}</p>}
        {requestsQuery.data && (
          <div className="flex flex-col gap-[22px]">
            {/* Card 020: the classroom queue is withdrawn until it has a backend.
            <Card className="border-primary/15 bg-card/95">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
                    <Video className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="brand-section-kicker">{t('classroom.kicker')}</p>
                    <CardTitle className="text-xl">{t('classroom.title')}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  {t('classroom.description')}
                </p>
                <Button asChild>
                  <Link to="/teacher/classroom">{t('classroom.open')}</Link>
                </Button>
              </CardContent>
            </Card>
            */}
            <TeacherStatsCards stats={statsQuery.data} />
            <TeacherRequestFilters value={filter} onChange={setFilter} />
            <HelpRequestList requests={filteredRequests} />
          </div>
        )}
        {/* Learning automation: the secondary entry inside Requests (#13 point 6). */}
        <Group title={t('requests.more')}>
          <Row
            to="/teacher/learning-automation"
            leading={{ kind: 'icon', icon: Sparkles }}
            title={t('requests.learningAutomation')}
            subtitle={t('requests.learningAutomationDescription')}
          />
        </Group>
      </PageContainer>
    </DashboardLayout>
  )
}
