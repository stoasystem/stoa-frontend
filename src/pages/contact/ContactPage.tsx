import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StoaLogo } from '@/components/common/StoaLogo'
import { ContactForm } from '@/components/contact/ContactForm'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { stoaContactInfo } from '@/lib/brandContact'

const contactCards = [
  {
    key: 'email',
    icon: Mail,
    value: stoaContactInfo.email,
    href: `mailto:${stoaContactInfo.email}`,
  },
  {
    key: 'phone',
    icon: Phone,
    value: stoaContactInfo.phone,
    href: stoaContactInfo.phoneHref,
  },
  {
    key: 'locations',
    icon: MapPin,
    value: stoaContactInfo.locations,
  },
] as const

export function ContactPage() {
  const { t } = useTranslation('contact')

  return (
    <MarketingLayout>
      <PageContainer size="wide" className="space-y-10 py-10 md:py-14">
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
        />

        <section className="grid gap-6 rounded-lg border border-[hsl(var(--border)/0.85)] bg-[hsl(42_34%_94%)] p-6 shadow-sm md:grid-cols-[0.7fr_1.3fr] md:items-center">
          <div className="space-y-4">
            <StoaLogo size="lg" />
            <p className="brand-section-kicker">{t('brandPanel.kicker')}</p>
          </div>
          <div className="space-y-4">
            <h2 className="editorial-heading text-3xl leading-tight text-foreground">
              {t('brandPanel.title')}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {t('brandPanel.description')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="premium-primary-button h-auto min-h-10 whitespace-normal px-4 py-2 text-center">
                <Link to="/stipendienprogramm">{t('brandPanel.scholarshipCta')}</Link>
              </Button>
              <Button asChild variant="outline" className="h-auto min-h-10 whitespace-normal px-4 py-2 text-center">
                <a href={stoaContactInfo.phoneHref}>{stoaContactInfo.phone}</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" aria-label={t('eyebrow')}>
          {contactCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.key} className="overflow-hidden">
                <CardHeader className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{t(`cards.${card.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>{t(`cards.${card.key}.description`)}</p>
                  {'href' in card ? (
                    <a className="font-medium text-foreground hover:text-primary" href={card.href}>
                      {card.value}
                    </a>
                  ) : (
                    <p className="font-medium text-foreground">{card.value}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-5 rounded-lg border border-border/80 bg-card/60 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="brand-section-kicker">{t('form.title')}</p>
            <h2 className="editorial-heading text-3xl leading-tight text-foreground">
              {t('form.description')}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('formContext')}
            </p>
            <address className="space-y-2 not-italic text-sm text-muted-foreground">
              <a className="block font-medium text-foreground hover:text-primary" href={`mailto:${stoaContactInfo.email}`}>
                {stoaContactInfo.email}
              </a>
              <a className="block font-medium text-foreground hover:text-primary" href={stoaContactInfo.phoneHref}>
                {stoaContactInfo.phone}
              </a>
              <p>{stoaContactInfo.locations}</p>
            </address>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('form.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </MarketingLayout>
  )
}
