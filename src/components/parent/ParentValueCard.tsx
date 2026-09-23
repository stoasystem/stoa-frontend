import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * The card had its three sentences written into it in English, so a family
 * reading the German dashboard got an English block in the middle of it.
 */
export function ParentValueCard({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  const { t } = useTranslation('parent')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title ?? t('valueCard.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {description ? (
          <p>{description}</p>
        ) : (
          <>
            <p>{t('valueCard.body1')}</p>
            <p>{t('valueCard.body2')}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
