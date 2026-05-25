import { Bug, GraduationCap, HelpCircle, Mail, TimerReset } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SupportInfoSection } from '@/components/support/SupportInfoSection'
import { SupportRequestForm } from '@/components/support/SupportRequestForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'

const sections = [
  {
    title: 'FAQ',
    icon: HelpCircle,
    items: [
      'Students should start with Chat for homework questions, explanations, and supported file uploads.',
      'Parents can use the parent dashboard and child reports to review learning progress and weak areas.',
      'Tutors should use the tutor dashboard for human help requests instead of handling requests outside STOA.',
    ],
  },
  {
    title: 'Bug feedback',
    icon: Bug,
    items: [
      'Report broken pages, missing data, confusing states, or anything that blocks a pilot task.',
      'Include the page, role, expected result, actual result, and whether the issue is blocking a student session.',
      'Do not paste passwords, tokens, full private chat transcripts, or file contents into support messages.',
    ],
  },
  {
    title: 'Teacher help vs support',
    icon: GraduationCap,
    items: [
      'Use teacher help when a student needs a tutor to review a learning question from Chat.',
      'Use support when the product, account, report, access, or pilot workflow itself is not working.',
      'Tutor request status belongs in the tutor workflow; operational issues belong in support.',
    ],
  },
  {
    title: 'Pilot expectations',
    icon: TimerReset,
    items: [
      'The pilot prioritizes reliability, clear learning support, and fast issue discovery over complete feature breadth.',
      'Some flows may use lightweight operations while the team validates demand and support volume.',
      'High-impact issues affecting live learning sessions should be marked high or urgent in the form.',
    ],
  },
]

export function SupportPage() {
  const { t } = useTranslation(['support', 'common'])

  return (
    <MarketingLayout>
      <PageContainer className="space-y-8">
        <PageHeader
          eyebrow={t('support:eyebrow')}
          title={t('support:title')}
          description={t('support:description')}
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
          actions={
            <Button variant="outline" asChild>
              <Link to="/onboarding">{t('support:viewOnboarding')}</Link>
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">FAQ</Badge>
          <Badge variant="secondary">Bug feedback</Badge>
          <Badge variant="secondary">Teacher-help distinction</Badge>
          <Badge variant="secondary">Contact path</Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <SupportInfoSection key={section.title} {...section} />
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
              <p>
                Send a support request for pilot access, bugs, report questions, or workflow
                confusion. The request is routed through the STOA support queue.
              </p>
              <p>
                If you cannot finish the form, use the feedback button in the app sidebar and
                select the closest feedback type.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('support:submit')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SupportRequestForm />
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </MarketingLayout>
  )
}
