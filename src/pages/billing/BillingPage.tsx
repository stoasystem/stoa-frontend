import { CreditCard, FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'

const billingItems = [
  {
    title: 'Subscription status',
    description: 'Pilot access is available without a paid subscription requirement.',
    icon: ShieldCheck,
  },
  {
    title: 'Payment method',
    description: 'No payment method is collected or stored by the frontend in this phase.',
    icon: CreditCard,
  },
  {
    title: 'Invoices and receipts',
    description: 'Invoice history will remain empty until a production billing provider is enabled.',
    icon: FileText,
  },
]

export function BillingPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Billing"
        description="Billing preparation placeholder. Payments, invoices, and subscription enforcement are not active."
      />

      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary">Pilot access</Badge>
          <span>Current state: billing not configured.</span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {billingItems.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Before Billing Goes Live</h2>
        <p className="mt-2">
          STOA should select a payment provider, define plan entitlements, document cancellation
          and refund rules, add server-side subscription verification, and complete privacy and
          terms updates before enforcing paid access.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/pricing">View pricing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/privacy">Privacy notice</Link>
          </Button>
        </div>
      </section>
    </PageContainer>
  )
}
