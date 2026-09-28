import { Activity, BarChart3, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminTeacherSlaCard } from '@/components/admin/AdminTeacherSlaCard'
import { AdminOperationalNotificationsCard } from '@/components/admin/AdminOperationalNotificationsCard'
import { Group, Row } from '@/components/base'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminPlatformStatsQuery } from '@/hooks/admin/useAdminPlatformStatsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

/*
 * The administrator's home and the source list's System item (#13 point 6,
 * #52): the operations overview, and the section's other pages as chevron
 * rows. Moderation and teacher applications have their own items in the
 * source list; account operations sits under Users.
 */
export function AdminDashboardPage() {
  const { t } = useTranslation('admin')
  const platformStatsQuery = useAdminPlatformStatsQuery()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader title={t('system.title')} description={t('system.description')} />
        <Group title={t('system.pages')}>
          <Row
            to="/admin/system"
            leading={{ kind: 'icon', icon: Activity }}
            title={t('system.status')}
            subtitle={t('system.statusDescription')}
          />
          <Row
            to="/admin/learning-operations"
            leading={{ kind: 'icon', icon: BarChart3 }}
            title={t('system.learningOperations')}
            subtitle={t('system.learningOperationsDescription')}
          />
          <Row
            to="/admin/learning-automation"
            leading={{ kind: 'icon', icon: Sparkles }}
            title={t('system.learningAutomation')}
            subtitle={t('system.learningAutomationDescription')}
          />
        </Group>
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('system.scope.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{t('system.scope.covers')}</p>
              <p>{t('system.scope.notYet')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Use these views to monitor learning support, usage patterns, and feedback triage.</p>
              <p>Configuration diagnostics are available only in the internal debug panel.</p>
            </CardContent>
          </Card>
        </div>
        <AdminTeacherSlaCard stats={platformStatsQuery.data?.teacher_sla} />
        <AdminOperationalNotificationsCard />
        {/* Card 007 (frozen): billing interest comes back as the source list's
            Subscriptions and billing item, not as a link here. */}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminDashboardPage
