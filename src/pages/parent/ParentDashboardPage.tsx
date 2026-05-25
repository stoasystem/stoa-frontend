import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ChildCard } from '@/components/parent/ChildCard'
import { ParentDashboardSkeleton } from '@/components/parent/ParentDashboardSkeleton'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
import { UpgradePromptCard } from '@/components/parent/UpgradePromptCard'
import { useParentChildrenQuery } from '@/hooks/parent/useParentChildrenQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ParentDashboardPage() {
  const childrenQuery = useParentChildrenQuery()
  const children = childrenQuery.data?.items ?? []

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          title="Parent Dashboard"
          description="See whether your child is learning, where they struggle, and when teacher support helps."
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <ParentValueCard />
          <UpgradePromptCard source="parent_dashboard" />
        </div>
        {childrenQuery.isLoading && <ParentDashboardSkeleton showHeader={false} />}
        {childrenQuery.isError && <p className="text-sm text-destructive">Failed to load children.</p>}
        {childrenQuery.data && children.length === 0 && (
          <p className="text-sm text-muted-foreground">No children are bound to this parent account.</p>
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
