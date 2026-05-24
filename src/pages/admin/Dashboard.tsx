import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Admin entry is available in Phase 6 as a placeholder. Full user, tutor, and platform
          management remains out of scope for this milestone.
        </p>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboardPage
