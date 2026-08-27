import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  CreditCard,
  GraduationCap,
  Languages,
  Mail,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { LearningProfileSignals } from '@/components/learning/LearningProfileSignals'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { useStudentLearningProfileQuery } from '@/hooks/student/useStudentLearningProfileQuery'
import { useUpdateStudentProfileMutation } from '@/hooks/student/useUpdateStudentProfileMutation'
import { useStudentEntitlementQuery } from '@/hooks/student/useStudentEntitlementQuery'
import { languageOptions, type SupportedLanguage } from '@/i18n/languages'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { getSubscriptionPlanLabel } from '@/lib/displayLabels'
import { studentProfileSchema } from '@/lib/validation'
import type { SubscriptionPlan } from '@/types/billing'
import type { StudentEntitlement, StudentProfile } from '@/types/student'

type ProfileErrors = {
  grade?: string
  primarySubjects?: string
  preferredAnswerLanguage?: string
}

const guardianStatusLabel: Record<StudentProfile['guardianStatus'], string> = {
  linked: 'Linked',
  not_linked: 'Not linked',
}

type ProfileBillingSnapshot = {
  planName: string
  statusLabel: string
  nextBillingDate?: string
}

export function StudentProfilePage() {
  const { t } = useTranslation('practice')
  const profileQuery = useStudentProfileQuery()
  const entitlementQuery = useStudentEntitlementQuery()
  const learningProfileQuery = useStudentLearningProfileQuery(profileQuery.data?.userId)
  const updateProfile = useUpdateStudentProfileMutation()
  const [grade, setGrade] = useState('')
  const [schoolSystem, setSchoolSystem] = useState('')
  const [primarySubjects, setPrimarySubjects] = useState('')
  const [preferredAnswerLanguage, setPreferredAnswerLanguage] = useState<SupportedLanguage>('en')
  const [errors, setErrors] = useState<ProfileErrors>({})

  useEffect(() => {
    if (!profileQuery.data) return
    setGrade(profileQuery.data.grade)
    setSchoolSystem(profileQuery.data.schoolSystem ?? '')
    setPrimarySubjects(profileQuery.data.primarySubjects.join(', '))
    setPreferredAnswerLanguage(profileQuery.data.preferredAnswerLanguage)
  }, [profileQuery.data])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const subjects = primarySubjects
      .split(',')
      .map((subject) => subject.trim())
      .filter(Boolean)
    const result = studentProfileSchema.safeParse({
      grade,
      schoolSystem,
      primarySubjects: subjects,
      preferredAnswerLanguage,
    })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        grade: fieldErrors.grade?.[0],
        primarySubjects: fieldErrors.primarySubjects?.[0],
        preferredAnswerLanguage: fieldErrors.preferredAnswerLanguage?.[0],
      })
      toast.error('Check the profile fields before saving.')
      return
    }

    setErrors({})
    updateProfile.mutate(result.data)
  }

  const profile = profileQuery.data
  const billing = getProfileBillingSnapshot(entitlementQuery.data, entitlementQuery.isPending)

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          title="Student Profile"
          description="Account, family, billing, and learning context used to keep STOA support accurate."
        />
        {profileQuery.isLoading && <PageSkeleton rows={4} />}
        {profileQuery.isError && <p className="text-sm text-destructive">Failed to load profile.</p>}
        {profile && (
          <>
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <ProfileIdentityCard profile={profile} />
              <AccountStatusCard profile={profile} billing={billing} />
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <GuardianCard profile={profile} />
              <BillingCard billing={billing} />
            </section>

            <section className="space-y-4">
              <SectionHeader
                title="Learning context"
                description={t('profile.editableFields')}
              />
              <form
                className="rounded-lg border border-border/70 bg-card/95 p-5 shadow-[var(--platform-shadow-card)]"
                onSubmit={handleSubmit}
              >
                <div className="grid gap-5 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Input id="grade" value={grade} onChange={(event) => setGrade(event.target.value)} />
                    {errors.grade && <p className="text-xs text-destructive">{errors.grade}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjects">Primary subjects</Label>
                    <Input
                      id="subjects"
                      value={primarySubjects}
                      onChange={(event) => setPrimarySubjects(event.target.value)}
                    />
                    {errors.primarySubjects && (
                      <p className="text-xs text-destructive">{errors.primarySubjects}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-system">School system</Label>
                    <Input
                      id="school-system"
                      value={schoolSystem}
                      onChange={(event) => setSchoolSystem(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer-language">Learning Assistant answer language</Label>
                    <select
                      id="answer-language"
                      className="h-10 w-full rounded-md border border-border/80 bg-card/75 px-3 text-sm text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
                      value={preferredAnswerLanguage}
                      onChange={(event) => setPreferredAnswerLanguage(event.target.value as SupportedLanguage)}
                    >
                      {languageOptions.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                    {errors.preferredAnswerLanguage && (
                      <p className="text-xs text-destructive">{errors.preferredAnswerLanguage}</p>
                    )}
                    <p className="text-xs leading-5 text-muted-foreground">
                      Used for Learning Assistant explanations.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? 'Saving...' : 'Save learning context'}
                  </Button>
                  {updateProfile.isError && <p className="text-sm text-destructive">Failed to save profile.</p>}
                  {updateProfile.isSuccess && <p className="text-sm text-muted-foreground">Profile saved.</p>}
                </div>
              </form>
            </section>
            <LearningProfileSignals
              title="Learning expansion"
              description={t('profile.subjectSignals')}
              profile={learningProfileQuery.data}
              isLoading={learningProfileQuery.isLoading}
              isError={learningProfileQuery.isError}
            />
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function ProfileIdentityCard({ profile }: { profile: StudentProfile }) {
  return (
    <Card className="border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--stoa-brand-burgundy-soft)_/_0.42)_100%)] shadow-[var(--platform-shadow-soft)]">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="brand-section-kicker">Student account</p>
            <CardTitle className="mt-2 text-3xl">{profile.name}</CardTitle>
            <CardDescription className="mt-2">
              {profile.grade} · {profile.schoolSystem ?? 'School system not set'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <ProfileDetail icon={Mail} label="Email" value={profile.email} />
        <ProfileDetail icon={GraduationCap} label="Primary subjects" value={profile.primarySubjects.join(', ')} />
        <ProfileDetail
          icon={Languages}
          label="Answer language"
          value={formatLanguage(profile.preferredAnswerLanguage)}
        />
      </CardContent>
    </Card>
  )
}

function AccountStatusCard({
  profile,
  billing,
}: {
  profile: StudentProfile
  billing?: ProfileBillingSnapshot
}) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Account status</CardTitle>
        <CardDescription>Access, family binding, and latest profile update.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileDetail icon={UserRound} label="Student ID" value={profile.userId} />
        <ProfileDetail
          icon={UsersRound}
          label="Parent account"
          value={guardianStatusLabel[profile.guardianStatus]}
        />
        <ProfileDetail icon={ShieldCheck} label="Billing status" value={billing?.statusLabel ?? 'Not set'} />
        <ProfileDetail icon={CalendarDays} label="Last updated" value={formatDate(profile.updatedAt)} />
      </CardContent>
    </Card>
  )
}

function GuardianCard({ profile }: { profile: StudentProfile }) {
  const { t } = useTranslation('practice')
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Parent or guardian</CardTitle>
        <CardDescription>{t('profile.guardianRequired')}</CardDescription>
      </CardHeader>
      <CardContent>
        {profile.guardianStatus === 'linked' ? (
          <p className="text-sm text-muted-foreground">
            A parent account is linked and can follow this student's progress.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No parent or guardian account is linked yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

function BillingCard({ billing }: { billing?: ProfileBillingSnapshot }) {
  const { t } = useTranslation('practice')
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Plan</CardTitle>
        <CardDescription>{t('profile.subscriptionCover')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {billing ? (
          <>
            <ProfileDetail icon={CreditCard} label="Plan" value={billing.planName} />
            <ProfileDetail icon={ShieldCheck} label="Status" value={billing.statusLabel} />
            <ProfileDetail icon={CalendarDays} label={t('profile.trialEnds')} value={formatDate(billing.nextBillingDate)} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No subscription is attached to this account.</p>
        )}
      </CardContent>
    </Card>
  )
}

function getProfileBillingSnapshot(
  entitlement: StudentEntitlement | undefined,
  pending: boolean,
): ProfileBillingSnapshot | undefined {
  if (pending) {
    return { planName: 'Loading...', statusLabel: 'Loading...' }
  }

  if (!entitlement) return undefined

  return {
    planName: getSubscriptionPlanLabel(entitlement.effectivePlan as SubscriptionPlan),
    statusLabel: entitlement.newUsageAllowed ? 'Active' : 'Paused',
    nextBillingDate: entitlement.freeTrialEndsAt ?? undefined,
  }
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

function formatLanguage(languageCode: SupportedLanguage) {
  return languageOptions.find((language) => language.code === languageCode)?.label ?? 'English'
}
