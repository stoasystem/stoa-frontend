import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PricingFAQ() {
  const { t } = useTranslation('pricing')
  const faqs = t('faqs', { returnObjects: true }) as Array<{
    question: string
    answer: string
  }>

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {faqs.map((faq) => (
        <Card key={faq.question}>
          <CardHeader>
            <CardTitle className="break-words text-base leading-6">{faq.question}</CardTitle>
          </CardHeader>
          <CardContent className="break-words text-sm leading-6 text-muted-foreground">{faq.answer}</CardContent>
        </Card>
      ))}
    </section>
  )
}
