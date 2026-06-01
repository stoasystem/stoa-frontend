import { Link } from 'react-router-dom'
import {
  CalendarDays,
  CreditCard,
  FileText,
  Mail,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { BackButton } from '@/components/common/BackButton'
import { PageActions } from '@/components/common/PageActions'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSubscriptionQuery } from '@/hooks/billing/useSubscriptionQuery'
import { enablePayment, showCheckoutPreview } from '@/lib/env'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function PaymentSettingsPage() {
  const subscriptionQuery = useSubscriptionQuery()
  const subscription = subscriptionQuery.data
  const paymentMethod = enablePayment ? 'Visa ending 4242' : 'Payment method not connected yet'
  const portalStatus = enablePayment ? 'Secure billing portal enabled' : 'Billing portal not connected yet'

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow="Billing"
          title="Payment settings"
          description="Review the family billing contact, payment method status, invoice settings, and subscription controls."
          actions={
            <PageActions
              primary={
                <Button asChild>
                  <Link to="/billing?plan=family">Change plan</Link>
                </Button>
              }
              secondary={<BackButton label="Billing" to="/billing" />}
            />
          }
        />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--stoa-brand-burgundy-soft)_/_0.4)_100%)] shadow-[var(--platform-shadow-soft)]">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="brand-section-kicker">Family billing</p>
                  <CardTitle className="mt-2 text-3xl">Martin Keller</CardTitle>
                  <CardDescription className="mt-2">
                    Billing owner for the linked student account and parent reports.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{enablePayment ? 'Active' : 'Plan review'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <SettingDetail icon={Mail} label="Billing email" value="parent@test.com" />
              <SettingDetail icon={UserRound} label="Billing role" value="Parent account owner" />
              <SettingDetail icon={CreditCard} label="Payment method" value={paymentMethod} />
              <SettingDetail icon={ShieldCheck} label="Portal status" value={portalStatus} />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription>Current billing state for this family account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingDetail icon={CreditCard} label="Current plan" value={subscription?.plan ?? 'Free trial'} />
              <SettingDetail icon={ShieldCheck} label="Status" value={subscription?.status ?? 'Trial'} />
              <SettingDetail icon={CalendarDays} label="Current period" value={formatDate(subscription?.currentPeriodEnd)} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Payment controls</CardTitle>
              <CardDescription>
                Card details are handled by the secure payment provider once live payments are enabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                {enablePayment
                  ? 'Use the secure billing portal to update cards, review invoices, and cancel or change plans.'
                  : 'STOA can review plan fit here. Card updates remain unavailable until secure payment setup is connected.'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild>
                  <Link to="/billing?plan=family">{showCheckoutPreview ? 'Review plan' : 'Open checkout'}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/support">Contact billing support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Invoices and receipts</CardTitle>
              <CardDescription>Invoice delivery and receipt access for the family account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingDetail icon={FileText} label="Invoice delivery" value="Email to parent@test.com" />
              <SettingDetail icon={CalendarDays} label="Receipt history" value="Available after first paid invoice" />
              <SettingDetail icon={ShieldCheck} label="Tax details" value="Family billing profile pending" />
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function SettingDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
