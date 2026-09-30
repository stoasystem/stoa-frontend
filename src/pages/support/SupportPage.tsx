import { Bug, GraduationCap, HelpCircle, Mail, TimerReset } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SupportInfoSection } from '@/components/support/SupportInfoSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { buildContactMailtoHref, stoaContactInfo } from '@/lib/brandContact'
import { useAuthStore } from '@/store/authStore'

const sectionKeys = [
  { key: 'faq', icon: HelpCircle },
  { key: 'problems', icon: Bug },
  { key: 'teacherHelp', icon: GraduationCap },
  { key: 'expectations', icon: TimerReset },
] as const

const tagKeys = ['faq', 'problems', 'teacherHelp', 'contact'] as const

/*
 * `/support`, the avatar menu's Help. Signed in, it stays inside the app shell
 * (the bar, the bell, the avatar and its sign-out), and offers nothing that
 * belongs to a visitor: the marketing layout's "Start learning" and the
 * public onboarding tour are left out (#46). Signed out, it is the public
 * page it always was.
 */
export function SupportPage() {
  const { t } = useTranslation(['support', 'common'])
  const signedIn = useAuthStore((state) => state.isAuthenticated && state.user !== null)
  const Layout = signedIn ? DashboardLayout : MarketingLayout
  const contactHref = buildContactMailtoHref(t('support:contactSubject'))

  const toItems = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

  return (
    <Layout>
      <PageContainer className="space-y-8">
        <PageHeader
          eyebrow={t('support:eyebrow')}
          title={t('support:title')}
          description={t('support:description')}
          actions={
            <>
              <Button variant="outline" asChild>
                <a href={contactHref} target="_blank" rel="noopener noreferrer">
                  {t('common:navigation.contact')}
                </a>
              </Button>
              {!signedIn && (
                <Button variant="outline" asChild>
                  <Link to="/onboarding">{t('support:viewOnboarding')}</Link>
                </Button>
              )}
            </>
          }
        />

        <div className="flex flex-wrap gap-2">
          {tagKeys.map((key) => (
            <Badge key={key} variant="secondary">
              {t(`support:tags.${key}`)}
            </Badge>
          ))}
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          {sectionKeys.map(({ key, icon }) => (
            <SupportInfoSection
              key={key}
              title={t(`support:sections.${key}.title`)}
              icon={icon}
              items={toItems(t(`support:sections.${key}.items`, { returnObjects: true }))}
            />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl">{t('support:contact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>{t('support:contactCard.requestText')}</p>
              <p>{t('support:contactCard.generalText')}</p>
              <p>
                <span className="font-medium text-foreground">
                  {t('support:contactCard.emailLabel')}:
                </span>{' '}
                <a
                  className="hover:text-foreground"
                  href={contactHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {stoaContactInfo.email}
                </a>
              </p>
              <Button asChild variant="outline" size="sm">
                <a href={contactHref} target="_blank" rel="noopener noreferrer">
                  {t('common:navigation.contact')}
                </a>
              </Button>
            </CardContent>
          </Card>

        </section>
      </PageContainer>
    </Layout>
  )
}
