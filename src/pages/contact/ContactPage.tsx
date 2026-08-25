import { Mail, MapPin, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
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
            <p className="brand-section-kicker">{t('form.title')}</p>
            <h2 className="editorial-heading text-3xl leading-tight text-foreground">
              {t('form.description')}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {stoaContactInfo.locations}
            </p>
          </div>

        </section>
      </PageContainer>
    </MarketingLayout>
  )
}
