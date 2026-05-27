import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  Clock,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTutorProfileQuery } from '@/hooks/tutor/useTutorProfileQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { TutorProfile } from '@/types/tutor'

const accountStatusLabel: Record<TutorProfile['accountStatus'], string> = {
  active: 'Active',
  paused: 'Paused',
  pending_review: 'Pending review',
}

const verificationStatusLabel: Record<TutorProfile['verificationStatus'], string> = {
  verified: 'Verified',
  pending: 'Pending',
  needs_update: 'Needs update',
}

const complianceLabel: Record<string, string> = {
  verified: 'Verified',
  pending: 'Pending',
  needs_update: 'Needs update',
  not_required: 'Not required',
}

const payoutMethodLabel: Record<TutorProfile['payout']['method'], string> = {
  bank_transfer: 'Bank transfer',
  paypal: 'PayPal',
  not_configured: 'Not configured',
}

export function TutorProfilePage() {
  const profileQuery = useTutorProfileQuery()
  const profile = profileQuery.data

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Tutor account"
          title="Teacher Profile"
          description="Contact, teaching coverage, verification, and salary settlement details for STOA teacher support."
        />
        {profileQuery.isLoading && <PageSkeleton rows={4} />}
        {profileQuery.isError && <p className="text-sm text-destructive">Failed to load teacher profile.</p>}
        {profile && (
          <>
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <TutorIdentityCard profile={profile} />
              <TutorStatusCard profile={profile} />
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <TeachingProfileCard profile={profile} />
              <PayoutCard profile={profile} />
            </section>

            <section className="space-y-4">
              <SectionHeader
                title="Credentials and compliance"
                description="Verification details used before assigning students to professional teacher support."
              />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <QualificationsCard profile={profile} />
                <ComplianceCard profile={profile} />
              </div>
            </section>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function TutorIdentityCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--stoa-brand-burgundy-soft)_/_0.42)_100%)] shadow-[var(--platform-shadow-soft)]">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="brand-section-kicker">Teacher account</p>
            <CardTitle className="mt-2 text-3xl">{profile.name}</CardTitle>
            <CardDescription className="mt-2">{profile.teachingSummary}</CardDescription>
          </div>
          <Badge variant="secondary">{verificationStatusLabel[profile.verificationStatus]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <ProfileDetail icon={Mail} label="Email" value={profile.email} />
        <ProfileDetail icon={Phone} label="Phone" value={profile.phone ?? 'Not provided'} />
        <ProfileDetail icon={MapPin} label="Location" value={formatLocation(profile)} />
        <ProfileDetail icon={Clock} label="Timezone" value={profile.timezone} />
      </CardContent>
    </Card>
  )
}

function TutorStatusCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Account status</CardTitle>
        <CardDescription>Operational state and latest profile update.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileDetail icon={UserRound} label="Tutor ID" value={profile.userId} />
        <ProfileDetail icon={ShieldCheck} label="Status" value={accountStatusLabel[profile.accountStatus]} />
        <ProfileDetail icon={BadgeCheck} label="Verification" value={verificationStatusLabel[profile.verificationStatus]} />
        <ProfileDetail icon={CalendarDays} label="Last updated" value={formatDate(profile.updatedAt)} />
      </CardContent>
    </Card>
  )
}

function TeachingProfileCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Teaching coverage</CardTitle>
        <CardDescription>Subjects, levels, languages, and routing availability.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TagGroup icon={GraduationCap} label="Subjects" values={profile.subjects} />
        <TagGroup icon={BadgeCheck} label="Levels" values={profile.levels} />
        <TagGroup icon={Languages} label="Languages" values={profile.languages} />
        <ProfileDetail icon={Clock} label="Availability" value={profile.availabilitySummary} />
      </CardContent>
    </Card>
  )
}

function PayoutCard({ profile }: { profile: TutorProfile }) {
  const payout = profile.payout

  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Salary settlement</CardTitle>
        <CardDescription>How STOA records payout and contractor settlement details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileDetail icon={Banknote} label="Method" value={payoutMethodLabel[payout.method]} />
        <ProfileDetail icon={UserRound} label="Account holder" value={payout.accountHolder} />
        <ProfileDetail icon={Banknote} label="Bank account" value={formatPayoutAccount(profile)} />
        <ProfileDetail icon={CalendarDays} label="Settlement cycle" value={payout.settlementCycle} />
        <ProfileDetail icon={CalendarDays} label="Next payout" value={formatDate(payout.nextPayoutDate)} />
        <ProfileDetail icon={ShieldCheck} label="Tax status" value={payout.taxStatus} />
      </CardContent>
    </Card>
  )
}

function QualificationsCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Professional credentials</CardTitle>
        <CardDescription>Reviewed credentials shown to operations before teacher matching.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {profile.qualifications.map((qualification) => (
          <div
            className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3"
            key={`${qualification.title}-${qualification.institution ?? 'institution'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{qualification.title}</p>
              {qualification.verified && <Badge variant="secondary">Verified</Badge>}
            </div>
            {qualification.institution && (
              <p className="mt-2 text-sm text-muted-foreground">{qualification.institution}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ComplianceCard({ profile }: { profile: TutorProfile }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Compliance</CardTitle>
        <CardDescription>Required checks before live student support.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileDetail
          icon={BadgeCheck}
          label="Credential review"
          value={complianceLabel[profile.compliance.credentialReview]}
        />
        <ProfileDetail
          icon={ShieldCheck}
          label="Background check"
          value={complianceLabel[profile.compliance.backgroundCheck]}
        />
        <ProfileDetail icon={CalendarDays} label="Terms accepted" value={formatDate(profile.compliance.termsAcceptedAt)} />
        <ProfileDetail icon={Banknote} label="Contract type" value={profile.payout.contractType} />
      </CardContent>
    </Card>
  )
}

function TagGroup({
  icon: Icon,
  label,
  values,
}: {
  icon: LucideIcon
  label: string
  values: string[]
}) {
  return (
    <div className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge className="max-w-full break-words" variant="outline" key={value}>
            {value}
          </Badge>
        ))}
      </div>
    </div>
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

function formatLocation(profile: TutorProfile) {
  return [profile.city, profile.country].filter(Boolean).join(', ') || 'Not provided'
}

function formatPayoutAccount(profile: TutorProfile) {
  const { bankName, maskedIban, payoutEmail, currency } = profile.payout

  if (maskedIban) return `${bankName ? `${bankName} · ` : ''}${maskedIban} · ${currency}`
  if (payoutEmail) return `${payoutEmail} · ${currency}`

  return `Not configured · ${currency}`
}

function formatDate(value?: string) {
  if (!value) return 'Not provided'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
