import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreditCard, HelpCircle, Settings, type LucideIcon } from 'lucide-react'
import { BillingStatusAlert } from '@/components/billing/BillingStatusAlert'
import { BillingSummaryCard } from '@/components/billing/BillingSummaryCard'
import { LockedFeatureCard } from '@/components/billing/LockedFeatureCard'
import { ManageBillingButton } from '@/components/billing/ManageBillingButton'
import { PlanUsageCard } from '@/components/billing/PlanUsageCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useBillingPlansQuery } from '@/hooks/billing/useBillingPlansQuery'
import { useBillingUsageQuery } from '@/hooks/billing/useBillingUsageQuery'
import { useFeatureAccessQuery } from '@/hooks/billing/useFeatureAccessQuery'
import { useCreateCheckoutSessionMutation } from '@/hooks/billing/useCreateCheckoutSessionMutation'
import { useSubscriptionQuery } from '@/hooks/billing/useSubscriptionQuery'
import { useParentChildrenQuery } from '@/hooks/parent/useParentChildrenQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { PurchasableSubscriptionPlan, SubscriptionPlan } from '@/types/billing'

function isSubscriptionPlan(plan: string | null): plan is SubscriptionPlan {
  return ['free_trial', 'student', 'teacher_supported', 'family'].includes(plan ?? '')
}

export function BillingPage() {
  const { t } = useTranslation(['billing', 'common'])
  const [searchParams] = useSearchParams()
  const requestedPlan = searchParams.get('plan')
  const rawPlan = isSubscriptionPlan(requestedPlan) ? requestedPlan : 'family'
  const selectedPlan: PurchasablePlan = PURCHASABLE_PLANS.includes(rawPlan)
    ? (rawPlan as PurchasablePlan)
    : 'family'
  const plansQuery = useBillingPlansQuery()
  const usageQuery = useBillingUsageQuery()
  const featureAccessQuery = useFeatureAccessQuery()
  const subscriptionQuery = useSubscriptionQuery()
  const childrenQuery = useParentChildrenQuery()
  const checkout = useCreateCheckoutSessionMutation()
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([])
  const [confirmSupersession, setConfirmSupersession] = useState(false)
  const subscription = subscriptionQuery.data
  const plan = useMemo(
    () => plansQuery.data?.items.find((item) => item.id === selectedPlan),
    [plansQuery.data?.items, selectedPlan],
  )

  useEffect(() => {
    trackEvent('billing_page_viewed', { selectedPlan })
  }, [selectedPlan])

  useEffect(() => {
    setSelectedBeneficiaryIds([])
    setConfirmSupersession(false)
  }, [selectedPlan])

  const selectionValid = isValidBeneficiarySelection(selectedPlan, selectedBeneficiaryIds)
  const pendingCommand = checkout.commandQuery.data
  const selectionDiffers = Boolean(
    pendingCommand &&
    selectionValid &&
    (
      pendingCommand.targetPlan !== selectedPlan ||
      !sameBeneficiaries(pendingCommand.beneficiaries, selectedBeneficiaryIds)
    )
  )
  const openCommand = Boolean(checkout.operation?.checkoutRef && !pendingCommand?.newCheckoutAllowed)
  const createLabel = checkout.isError ? 'Retry checkout' : 'Start checkout'

  function toggleBeneficiary(beneficiaryId: string) {
    setSelectedBeneficiaryIds((current) =>
      current.includes(beneficiaryId)
        ? current.filter((value) => value !== beneficiaryId)
        : [...current, beneficiaryId],
    )
  }

  function submitCheckout() {
    if (!selectionValid || selectedPlan === 'free_trial') return
    const selection = {
      plan: selectedPlan as PurchasableSubscriptionPlan,
      beneficiaryIds: selectedBeneficiaryIds,
    }
    if (openCommand) {
      if (selectionDiffers) setConfirmSupersession(true)
      return
    }
    checkout.mutate(selection)
  }

  function confirmCheckoutChange() {
    if (
      !checkout.operation?.checkoutRef ||
      selectedPlan === 'free_trial' ||
      !selectionValid
    ) return
    checkout.supersedeMutation.mutate({
      checkoutRef: checkout.operation.checkoutRef,
      selection: {
        plan: selectedPlan,
        beneficiaryIds: selectedBeneficiaryIds,
      },
    })
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('billing:title')}
          title={t('billing:subscription')}
          description={t('billing:description')}
          actions={<Badge variant="secondary">Server-confirmed checkout</Badge>}
        />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {subscription ? (
            <BillingSummaryCard
              plan={subscription.plan}
              status={subscription.status}
              currentPeriodEnd={subscription.currentPeriodEnd}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('billing:subscription')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {subscriptionQuery.isError
                  ? 'Billing details are not available yet. Please try again later or contact support.'
                  : t('billing:planLoading')}
              </CardContent>
            </Card>
          )}
          <Card className="brand-rule">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">{t('billing:checkoutMode')}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose a plan or update family payment settings from one place.
                  </p>
                </div>
                <Badge variant="secondary">Hosted payment</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="grid gap-3 sm:grid-cols-2">
                <BillingActionCard
                  icon={CreditCard}
                  title="Start checkout"
                  description={t('billing:paymentEnabledBody')}
                >
                  <div className="space-y-3">
                    <fieldset className="space-y-2" data-testid="checkout-beneficiaries">
                      <legend className="text-sm font-medium text-foreground">
                        Select beneficiaries
                      </legend>
                      {childrenQuery.data?.items.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBeneficiaryIds.includes(child.id)}
                            onChange={() => toggleBeneficiary(child.id)}
                          />
                          {child.name}
                        </label>
                      ))}
                      {childrenQuery.isError && (
                        <p className="text-sm text-destructive">
                          Beneficiaries are unavailable. Please try again.
                        </p>
                      )}
                    </fieldset>
                    {openCommand && (
                      <p
                        className="text-sm text-muted-foreground"
                        data-testid="checkout-open-command"
                      >
                        A checkout is already in progress for{' '}
                        {pendingCommand?.targetPlan.replace(/_/g, ' ') ?? 'the retained selection'}.
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={submitCheckout}
                      disabled={
                        checkout.isPending ||
                        checkout.supersedeMutation.isPending ||
                        !selectionValid ||
                        (openCommand && !selectionDiffers)
                      }
                    >
                      {checkout.isPending
                        ? 'Starting checkout'
                        : selectedPlan === 'free_trial'
                          ? 'Free trial does not require checkout'
                          : !selectionValid
                            ? beneficiaryRequirement(selectedPlan)
                            : openCommand && selectionDiffers
                              ? 'Change pending checkout'
                              : createLabel}
                    </Button>
                    {(checkout.error || checkout.supersedeMutation.error) && (
                      <p className="text-sm text-destructive" data-testid="checkout-error">
                        {(checkout.error ?? checkout.supersedeMutation.error)?.message}
                      </p>
                    )}
                    {confirmSupersession && (
                      <div
                        className="space-y-3 rounded-md border border-primary/30 p-3"
                        data-testid="checkout-supersession-confirmation"
                      >
                        <p className="text-sm text-foreground">
                          Replace the pending {pendingCommand?.targetPlan.replace(/_/g, ' ')} checkout
                          with this plan and beneficiary selection?
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmSupersession(false)}
                          >
                            Keep original checkout
                          </Button>
                          <Button type="button" onClick={confirmCheckoutChange}>
                            Confirm plan change
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </BillingActionCard>
                <BillingActionCard
                  icon={Settings}
                  title="Payment settings"
                  description="Update saved payment method and invoice settings."
                >
                  <ManageBillingButton />
                </BillingActionCard>
              </div>
              <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="min-w-0">
                    Need help with a charge or invoice?
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/support">{t('common:navigation.support')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <BillingStatusAlert />

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {usageQuery.data && <PlanUsageCard usage={usageQuery.data} />}
          {!usageQuery.isLoading && !usageQuery.data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('billing:usage')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Billing details are not available yet. Learning activity will appear here once the account is active.
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('billing:selectedPlan')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                {plan
                  ? `${plan.name}: ${plan.currency} ${plan.priceMonthly}/mo. ${plan.audience}`
                  : t('billing:planLoading')}
              </p>
              <p>{t('billing:limitsBody')}</p>
              <p>{t('billing:securityBody')}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {featureAccessQuery.data?.canRequestTeacherHelp === false && (
            <LockedFeatureCard
              feature="Teacher help"
              reason={featureAccessQuery.data.reason?.teacherHelp ?? t('billing:teacherUpgradeReason')}
            />
          )}
          {featureAccessQuery.data?.canUploadFiles === false && (
            <LockedFeatureCard
              feature="File uploads"
              reason={featureAccessQuery.data.reason?.fileUploads ?? t('billing:fileUploadReason')}
            />
          )}
          {featureAccessQuery.data?.canViewParentReports === false && (
            <LockedFeatureCard
              feature="Parent reports"
              reason={featureAccessQuery.data.reason?.parentReports ?? t('billing:parentReportReason')}
            />
          )}
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}

function isValidBeneficiarySelection(
  plan: SubscriptionPlan,
  beneficiaryIds: string[],
) {
  const uniqueCount = new Set(beneficiaryIds).size
  if (uniqueCount !== beneficiaryIds.length) return false
  if (plan === 'free_trial') return false
  if (plan === 'family') return uniqueCount >= 1 && uniqueCount <= 3
  return uniqueCount === 1
}

function sameBeneficiaries(left: string[], right: string[]) {
  return [...left].sort().join('\u0000') === [...right].sort().join('\u0000')
}

function beneficiaryRequirement(plan: SubscriptionPlan) {
  if (plan === 'free_trial') return 'Free trial does not require checkout'
  if (plan === 'family') return 'Select 1 to 3 beneficiaries'
  return 'Select exactly one beneficiary'
}

function BillingActionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-44 flex-col rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-auto pt-4 [&_button]:w-full [&_a]:w-full">{children}</div>
    </div>
  )
}
