import { useTranslation } from 'react-i18next'
// CalendarDays goes back into this import with the monthly report row below.
import { FileText, UserRound } from 'lucide-react'
import { Group, Row, Stats } from '@/components/base'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { useParentChildrenQuery } from '@/hooks/parent/useParentChildrenQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { ParentChild } from '@/types/parent'

/*
 * Parent board, Reports (#52): the figures under the title, then one grouped
 * list per child whose rows open that child's summary and weekly report. The
 * monthly report has no route yet, so it has no row.
 */
export function ParentReportsPage() {
  const { t } = useTranslation('parent')
  const childrenQuery = useParentChildrenQuery()
  const children = childrenQuery.data?.items ?? []

  return (
    <DashboardLayout>
      <PageContainer className="max-w-[880px] space-y-6 p-0">
        <PageHeader eyebrow={t('reports.eyebrow')} title={t('reports.title')} description={t('reports.description')} />

        <Stats
          items={[
            { key: 'children', value: children.length, label: t('reports.children') },
            { key: 'weekly', value: t('reports.weeklyReportsValue'), label: t('reports.weeklyReports') },
            // Monthly trends come back with the monthly report's route (see ChildReports).
            // { key: 'monthly', value: t('reports.monthlyTrendsValue'), label: t('reports.monthlyTrends') },
          ]}
        />

        <section className="space-y-4">
          <p className="m-0 text-[15px] leading-[1.45] text-caption">{t('reports.studentReportsDescription')}</p>
          {childrenQuery.isLoading && <PageSkeleton rows={3} />}
          {childrenQuery.isError && <p className="text-sm text-red">{t('loadChildrenFailed')}</p>}
          {childrenQuery.data && children.length === 0 && (
            <p className="m-0 text-[15px] text-caption">{t('reports.noChildren')}</p>
          )}
          {children.map((child) => (
            <ChildReports child={child} key={child.id} />
          ))}
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function ChildReports({ child }: { child: ParentChild }) {
  const { t } = useTranslation('parent')
  const about = `${child.grade ?? t('reports.gradeNotSet')} · ${child.subjects.join(', ') || t('reports.noSubjects')}`

  return (
    <Group title={t('reports.childReports', { name: child.name })}>
      <Row
        to={`/parent/children/${child.id}`}
        leading={{ kind: 'icon', icon: UserRound, tone: 'accent' }}
        title={t('reports.summary')}
        subtitle={about}
      />
      <Row
        to={`/parent/children/${child.id}/report`}
        leading={{ kind: 'icon', icon: FileText }}
        title={t('weeklyReport')}
        subtitle={t('reports.weeklyLinkDescription')}
      />
      {/*
        * The monthly report row comes back when /parent/children/:id/monthly-report
        * is a registered route; until then it would open the 404 page (#78 review).
      <Row
        to={`/parent/children/${child.id}/monthly-report`}
        leading={{ kind: 'icon', icon: CalendarDays }}
        title={t('monthlyReport')}
        subtitle={t('reports.monthlyLinkDescription')}
      />
      */}
    </Group>
  )
}
