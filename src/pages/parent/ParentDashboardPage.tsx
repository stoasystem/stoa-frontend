import { ChildCard } from '@/components/parent/ChildCard'
import { useParentChildrenQuery } from '@/hooks/parent/useParentChildrenQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function ParentDashboardPage() {
  const childrenQuery = useParentChildrenQuery()
  const children = childrenQuery.data?.items ?? []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parent Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor bound student learning summaries and teacher-help activity.
          </p>
        </div>
        {childrenQuery.isLoading && <p className="text-sm text-muted-foreground">Loading children...</p>}
        {childrenQuery.isError && <p className="text-sm text-destructive">Failed to load children.</p>}
        {childrenQuery.data && children.length === 0 && (
          <p className="text-sm text-muted-foreground">No children are bound to this parent account.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
