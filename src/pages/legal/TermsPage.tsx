import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Seo } from '@/components/common/Seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'

/* Card 007: the subscriptions section is withdrawn while billing is frozen.
 * Its copy is kept in `legal.json` in all four languages; only its place in
 * this list is taken out, the same way the billing routes are withdrawn in
 * `AppRouter.tsx`. To unfreeze, put 'subscriptions' back before
 * 'serviceChanges'.
 */
const sectionKeys = ['learningSupport', 'accuracy', 'acceptableUse', 'serviceChanges'] as const

export function TermsPage() {
  const { t } = useTranslation('legal')

  return (
    <MarketingLayout>
      <Seo title={`${t('terms.title')} | STOA`} description={t('terms.description')} />
      <PageContainer>
        <PageHeader
          eyebrow={t('terms.eyebrow')}
          title={t('terms.title')}
          description={t('terms.description')}
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
        />
        <div className="space-y-4">
          {sectionKeys.map((sectionKey) => (
            <Card key={sectionKey}>
              <CardHeader>
                <CardTitle className="text-base">{t(`terms.sections.${sectionKey}.title`)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {t(`terms.sections.${sectionKey}.body`)}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </MarketingLayout>
  )
}
