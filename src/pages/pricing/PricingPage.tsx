import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'

const plans = [
  {
    name: 'Pilot',
    price: 'Included',
    audience: 'Early testers and internal demos',
    features: ['Student learning chat', 'Tutor backup flow', 'Parent progress visibility'],
  },
  {
    name: 'Family',
    price: 'Pricing TBD',
    audience: 'Parents supporting one or more students',
    features: ['Linked student summaries', 'Learning history', 'Billing-ready account structure'],
  },
  {
    name: 'School',
    price: 'Pricing TBD',
    audience: 'Tutors, classrooms, and learning programs',
    features: ['Tutor queue workflows', 'Role-based access', 'Operational restore expectations'],
  },
]

export function PricingPage() {
  return (
    <PageContainer size="wide">
      <PageHeader
        title="Pricing"
        description="Pilot pricing placeholder for STOA subscription planning. Payments are not enabled."
      />

      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary">Phase 46 placeholder</Badge>
          <span>No checkout, paid entitlement, or plan enforcement is active.</span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-semibold text-foreground">{plan.price}</div>
              <p className="text-sm leading-6 text-muted-foreground">{plan.audience}</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                variant={plan.name === 'Pilot' ? 'default' : 'outline'}
                className="w-full"
              >
                <Link to={plan.name === 'Pilot' ? '/register' : '/billing'}>
                  {plan.name === 'Pilot' ? 'Join pilot' : 'View billing placeholder'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Billing Preparation Notes</h2>
        <p className="mt-2">
          STOA may add paid subscriptions later, but this page currently exists only to prepare
          product copy, plan naming, and frontend route structure. Final pricing, taxes, receipts,
          cancellation rules, trials, and payment processor behavior must be defined before payment
          enforcement is introduced.
        </p>
      </section>
    </PageContainer>
  )
}
