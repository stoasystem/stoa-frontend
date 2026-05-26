import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ChildCard } from '@/components/parent/ChildCard'
import { LearningActivitySummary } from '@/components/parent/LearningActivitySummary'
import { ParentDashboardSkeleton } from '@/components/parent/ParentDashboardSkeleton'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
import { UpgradePromptCard } from '@/components/parent/UpgradePromptCard'
import { useParentChildrenQuery } from '@/hooks/parent/useParentChildrenQuery'
import { usePracticeParentSummaryQuery } from '@/hooks/practice/usePracticeParentSummaryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ParentDashboardPage() {
  const { t } = useTranslation('parent')
  const childrenQuery = useParentChildrenQuery()
  const children = childrenQuery.data?.items ?? []
  const firstChildId = children[0]?.id ?? 'user-student'
  const practiceSummaryQuery = usePracticeParentSummaryQuery(firstChildId)

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          title={t('dashboardTitle')}
          description={t('dashboardDescription')}
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <ParentValueCard />
          <UpgradePromptCard source="parent_dashboard" />
        </div>
        <LearningActivitySummary summary={practiceSummaryQuery.data} />
        {childrenQuery.isLoading && <ParentDashboardSkeleton showHeader={false} />}
        {childrenQuery.isError && <p className="text-sm text-destructive">{t('loadChildrenFailed')}</p>}
        {childrenQuery.data && children.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('noChildren')}</p>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
