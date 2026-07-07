import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'

const sectionKeys = ['dataWeCollect', 'studentLearning', 'visibility', 'useRetention', 'thirdParties'] as const

export function PrivacyPage() {
  const { t } = useTranslation('legal')

  return (
    <MarketingLayout>
      <PageContainer>
        <PageHeader
          eyebrow={t('privacy.eyebrow')}
          title={t('privacy.title')}
          description={t('privacy.description')}
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
        />
        <div className="space-y-4">
          {sectionKeys.map((sectionKey) => (
            <Card key={sectionKey}>
              <CardHeader>
                <CardTitle className="text-base">{t(`privacy.sections.${sectionKey}.title`)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {t(`privacy.sections.${sectionKey}.body`)}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </MarketingLayout>
  )
}
