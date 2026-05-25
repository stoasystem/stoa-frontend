import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faqs = [
  {
    question: 'Is payment live now?',
    answer: 'Checkout is currently shown as a safe demo flow. When payments are enabled, STOA will send families through a hosted checkout page.',
  },
  {
    question: 'Can parents test before paying?',
    answer: 'Yes. The free trial keeps the early family validation path visible while pricing is tested.',
  },
  {
    question: 'Does the frontend enforce quotas?',
    answer: 'Plan limits are shown in the product experience. In a live subscription, account services enforce usage automatically.',
  },
]

export function PricingFAQ() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {faqs.map((faq) => (
        <Card key={faq.question}>
          <CardHeader>
            <CardTitle className="text-base">{faq.question}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{faq.answer}</CardContent>
        </Card>
      ))}
    </section>
  )
}
