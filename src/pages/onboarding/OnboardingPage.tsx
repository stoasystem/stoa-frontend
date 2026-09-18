import { GraduationCap, MessageSquareText, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { OnboardingRoleGuide } from '@/components/onboarding/OnboardingRoleGuide'
import type { OnboardingRoleStep } from '@/components/onboarding/OnboardingRoleGuide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'

const roleKeys = [
  { key: 'student', icon: MessageSquareText },
  { key: 'parent', icon: Users },
  { key: 'tutor', icon: GraduationCap },
] as const

const badgeKeys = ['student', 'parent', 'tutor'] as const

export function OnboardingPage() {
  const { t } = useTranslation('support')

  const toStrings = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

  const toSteps = (value: unknown): OnboardingRoleStep[] =>
    Array.isArray(value)
      ? value.filter(
          (step): step is OnboardingRoleStep =>
            typeof step === 'object' &&
            step !== null &&
            typeof (step as OnboardingRoleStep).title === 'string' &&
            typeof (step as OnboardingRoleStep).description === 'string',
        )
      : []

  return (
    <MarketingLayout>
      <PageContainer className="space-y-8">
        <PageHeader
          eyebrow={t('onboarding.eyebrow')}
          title={t('onboarding.title')}
          description={t('onboarding.description')}
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
          actions={
            <Button asChild>
              <Link to="/support">{t('onboarding.needHelp')}</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{t('onboarding.badges.audience')}</Badge>
              {badgeKeys.map((key) => (
                <Badge key={key} variant="outline">
                  {t(`onboarding.badges.${key}`)}
                </Badge>
              ))}
            </div>
            <CardTitle className="text-xl">{t('onboarding.expectations.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            {toStrings(t('onboarding.expectations.items', { returnObjects: true })).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-3">
          {roleKeys.map(({ key, icon }) => (
            <OnboardingRoleGuide
              key={key}
              title={t(`onboarding.roles.${key}.title`)}
              audience={t(`onboarding.roles.${key}.audience`)}
              icon={icon}
              steps={toSteps(t(`onboarding.roles.${key}.steps`, { returnObjects: true }))}
            />
          ))}
        </section>
      </PageContainer>
    </MarketingLayout>
  )
}
