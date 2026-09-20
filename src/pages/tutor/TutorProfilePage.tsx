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
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTutorProfileQuery } from '@/hooks/tutor/useTutorProfileQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { TutorProfile } from '@/types/tutor'

export function TutorProfilePage() {
  const { t } = useTranslation('tutor')
  const profileQuery = useTutorProfileQuery()
  const profile = profileQuery.data

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow={t('profile.eyebrow')}
          title={t('profile.title')}
          description={t('profile.description')}
        />
        {profileQuery.isLoading && <PageSkeleton rows={4} />}
        {profileQuery.isError && (
          <p className="text-sm text-destructive">{t('profile.loadFailed')}</p>
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
  const { t } = useTranslation('tutor')

  return (
    <Card className="border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--stoa-brand-burgundy-soft)_/_0.42)_100%)] shadow-[var(--platform-shadow-soft)]">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="brand-section-kicker">{t('profile.eyebrow')}</p>
            <CardTitle className="mt-2 text-3xl">{profile.name}</CardTitle>
          </div>
          <Badge variant="secondary">
            {t(`profile.availabilityStatus.${profile.availabilityStatus}`, {
              defaultValue: profile.availabilityStatus,
            })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <ProfileDetail icon={Mail} label={t('profile.email')} value={profile.email} />
        <ProfileDetail icon={UserRound} label={t('profile.teacherId')} value={profile.userId} />
      </CardContent>
    </Card>
  )
}

function StatusCard({ profile }: { profile: TutorProfile }) {
  const { t, i18n } = useTranslation('tutor')

  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{t('profile.statusTitle')}</CardTitle>
        <CardDescription>{t('profile.statusDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileDetail
          icon={ShieldCheck}
          label={t('profile.statusLabel')}
          value={t(`profile.accountStatus.${profile.accountStatus}`, {
            defaultValue: profile.accountStatus,
          })}
        />
        <ProfileDetail
          icon={Users}
          label={t('profile.concurrentStudents')}
          value={
            profile.maxActiveSessions == null
              ? t('profile.concurrentNotSet')
              : t('profile.concurrentValue', { count: profile.maxActiveSessions })
          }
        />
        <ProfileDetail
          icon={CalendarDays}
          label={t('profile.lastUpdated')}
          value={formatDate(profile.updatedAt, i18n.language, t)}
        />
      </CardContent>
    </Card>
  )
}

function CoverageCard({ profile }: { profile: TutorProfile }) {
  const { t, i18n } = useTranslation('tutor')

  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)] lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">{t('profile.coverageTitle')}</CardTitle>
        <CardDescription>{t('profile.coverageDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('profile.subjects')}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.subjects.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('profile.noSubjects')}</p>
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
            {t('profile.weeklyAvailability')}
          </div>
          <div className="mt-3 space-y-2">
            {profile.weeklyAvailability.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('profile.noWeeklyHours')}</p>
            )}
            {profile.weeklyAvailability.map((slot) => (
              <p
                className="text-sm font-semibold text-foreground"
                key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
              >
                {formatWeekday(slot.dayOfWeek, i18n.language)} · {slot.startTime}–{slot.endTime}
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

function formatDate(value: string | undefined, language: string, t: TFunction) {
  if (!value) return t('profile.notProvided')

  return new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

// 2024-01-07 is a Sunday, so day 0 lands on it.
function formatWeekday(dayOfWeek: number | string, language: string) {
  const day = Number(dayOfWeek)
  if (!Number.isInteger(day) || day < 0 || day > 6) return String(dayOfWeek)

  return new Intl.DateTimeFormat(language, { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, 7 + day)),
  )
}
