import { Link } from 'react-router-dom'
import { BarChart3, CalendarDays, FileText, UsersRound, type LucideIcon } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useParentChildrenQuery } from '@/hooks/parent/useParentChildrenQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { ParentChild } from '@/types/parent'

export function ParentReportsPage() {
  const childrenQuery = useParentChildrenQuery()
  const children = childrenQuery.data?.items ?? []

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow="Parent reports"
          title="Reports"
          description="Choose a child report and review weekly progress, monthly trends, weak topics, and teacher-support activity."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <ReportMetricCard
            icon={UsersRound}
            label="Children"
            value={String(children.length)}
            description="Linked student accounts"
          />
          <ReportMetricCard
            icon={FileText}
            label="Weekly reports"
            value="Ready"
            description="Short progress and next-action view"
          />
          <ReportMetricCard
            icon={BarChart3}
            label="Monthly trends"
            value="Available"
            description="Broader subject and support patterns"
          />
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Student reports"
            description="Open the report that matches the time horizon you want to review."
          />
          {childrenQuery.isLoading && <PageSkeleton rows={3} />}
          {childrenQuery.isError && <p className="text-sm text-destructive">Failed to load children.</p>}
          {childrenQuery.data && children.length === 0 && (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                No linked student accounts are available yet.
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {children.map((child) => (
              <StudentReportCard child={child} key={child.id} />
            ))}
          </div>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function StudentReportCard({ child }: { child: ParentChild }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">{child.name}</CardTitle>
            <CardDescription className="mt-2">
              {child.grade ?? 'Grade not set'} · {child.subjects.join(', ') || 'No subjects set'}
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/parent/children/${child.id}`}>Summary</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <ReportLinkCard
          icon={FileText}
          title="Weekly report"
          description="Recent questions, weak topics, teacher support, and the next parent action."
          to={`/parent/children/${child.id}/report`}
        />
        <ReportLinkCard
          icon={CalendarDays}
          title="Monthly report"
          description="Subject trends, recurring weak points, and longer-term support patterns."
          to={`/parent/children/${child.id}/monthly-report`}
        />
      </CardContent>
    </Card>
  )
}

function ReportLinkCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: LucideIcon
  title: string
  description: string
  to: string
}) {
  return (
    <Link
      className="group rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4 transition-colors hover:border-primary/50 hover:bg-[hsl(var(--stoa-brand-burgundy-soft))]"
      to={to}
    >
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  )
}

function ReportMetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon
  label: string
  value: string
  description: string
}) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardContent className="flex gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
