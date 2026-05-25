import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faqs = [
  {
    question: 'Is payment live now?',
    answer: 'Checkout is currently shown as a safe demo flow. When payments are enabled, STOA will send families through a hosted checkout page.',
  },
  {
    question: 'Can parents test before paying?',
    answer: 'Yes. Families can start with the free trial, see how STOA fits homework routines, and choose a paid plan later.',
  },
  {
    question: 'What happens when a plan limit is reached?',
    answer: 'STOA will show a clear upgrade or renewal path before a student loses access to the support they need.',
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
