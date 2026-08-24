import {
  CalendarDays,
  Clock,
  GraduationCap,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTutorProfileQuery } from '@/hooks/tutor/useTutorProfileQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { TutorProfile } from '@/types/tutor'

const accountStatusLabel: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  pending_review: 'Pending review',
}

const availabilityLabel: Record<string, string> = {
  available: 'Available for students',
  busy: 'Currently busy',
  unavailable: 'Not accepting students',
}

const weekdayLabel = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function TutorProfilePage() {
  const profileQuery = useTutorProfileQuery()
  const profile = profileQuery.data

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Teacher account"
          title="Teacher Profile"
          description="Your account details and the teaching coverage students are matched against."
        />
        {profileQuery.isLoading && <PageSkeleton rows={4} />}
        {profileQuery.isError && (
          <p className="text-sm text-destructive">Failed to load teacher profile.</p>
        )}
        {profile && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <IdentityCard profile={profile} />
            <StatusCard profile={profile} />
            <CoverageCard profile={profile} />
          </section>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function IdentityCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--stoa-brand-burgundy-soft)_/_0.42)_100%)] shadow-[var(--platform-shadow-soft)]">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="brand-section-kicker">Teacher account</p>
            <CardTitle className="mt-2 text-3xl">{profile.name}</CardTitle>
          </div>
          <Badge variant="secondary">
            {availabilityLabel[profile.availabilityStatus] ?? profile.availabilityStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <ProfileDetail icon={Mail} label="Email" value={profile.email} />
        <ProfileDetail icon={UserRound} label="Teacher ID" value={profile.userId} />
      </CardContent>
    </Card>
  )
}

function StatusCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Account status</CardTitle>
        <CardDescription>Operational state and latest profile update.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileDetail
          icon={ShieldCheck}
          label="Status"
          value={accountStatusLabel[profile.accountStatus] ?? profile.accountStatus}
        />
        <ProfileDetail
          icon={Users}
          label="Concurrent students"
          value={
            profile.maxActiveSessions == null
              ? 'Not set'
              : `Up to ${profile.maxActiveSessions} at a time`
          }
        />
        <ProfileDetail icon={CalendarDays} label="Last updated" value={formatDate(profile.updatedAt)} />
      </CardContent>
    </Card>
  )
}

function CoverageCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)] lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Teaching coverage</CardTitle>
        <CardDescription>What students are routed to you for, and when.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
            Subjects
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.subjects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No subjects set yet, so no students can be routed to you.
              </p>
            )}
            {profile.subjects.map((subject) => (
              <Badge className="max-w-full break-words" variant="outline" key={subject}>
                {subject}
              </Badge>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            Weekly availability
          </div>
          <div className="mt-3 space-y-2">
            {profile.weeklyAvailability.length === 0 && (
              <p className="text-sm text-muted-foreground">No weekly hours set.</p>
            )}
            {profile.weeklyAvailability.map((slot) => (
              <p
                className="text-sm font-semibold text-foreground"
                key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
              >
                {weekdayLabel[Number(slot.dayOfWeek)] ?? slot.dayOfWeek} · {slot.startTime}–
                {slot.endTime}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return 'Not provided'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
