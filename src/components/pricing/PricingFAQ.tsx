import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faqs = [
  {
    question: 'Is payment live now?',
    answer: 'Phase 11 supports a mock checkout flow. Real hosted checkout will be created by a future backend.',
  },
  {
    question: 'Can parents test before paying?',
    answer: 'Yes. The free trial keeps the early family validation path visible while pricing is tested.',
  },
  {
    question: 'Does the frontend enforce quotas?',
    answer: 'No. The frontend displays locked states from API contracts; future backend services enforce limits.',
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
