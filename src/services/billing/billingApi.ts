import { httpClient } from '@/services/api/httpClient'
import {
  mockBillingPlans,
} from '@/data/phase11MockData'
import { getStoredUTM } from '@/lib/utm'
import type { BillingUsage, FeatureAccess, Subscription, SubscriptionPlan } from '@/types/billing'
import type { ParentSubscription, SubscriptionBilling, SubscriptionTier } from '@/types/subscriptionOperations'

export async function getBillingPlans() {
  return { items: mockBillingPlans }
}

export async function getSubscription() {
  const response = await httpClient.get<ParentSubscription>('/parents/me/subscription')
  return mapParentSubscription(response.data)
}

export async function getBillingUsage() {
  const response = await httpClient.get<ParentSubscription>('/parents/me/subscription')
  return mapBillingUsage(response.data)
}

export async function getFeatureAccess() {
  const response = await httpClient.get<ParentSubscription>('/parents/me/subscription')
  return mapFeatureAccess(response.data)
}

export async function createCheckoutSession(plan: SubscriptionPlan) {
  const requestedTier = planToTier(plan)
  if (requestedTier === 'free') {
    throw new Error('Checkout is only available for paid plans.')
  }
  const response = await httpClient.post<{ checkoutUrl: string }>(
    '/parents/me/subscription/checkout',
    {
      requested_tier: requestedTier,
      success_url: `${window.location.origin}/billing/checkout/success?plan=${plan}`,
      cancel_url: `${window.location.origin}/billing/checkout/cancel?plan=${plan}`,
      utm: getStoredUTM(),
    },
  )
  return response.data
}

function mapParentSubscription(subscription: ParentSubscription): Subscription {
  const billing = subscription.billing
  const entitlement = firstEntitlement(subscription)
  const plan = tierToPlan(entitlement?.effectivePlan ?? billing?.subscriptionTier ?? subscription.currentTier)
  return {
    plan,
    status: billingStatusToSubscriptionStatus(billing),
    currentPeriodEnd: billing?.currentPeriodEnd ?? entitlement?.period?.end ?? undefined,
  }
}

function mapBillingUsage(subscription: ParentSubscription): BillingUsage {
  const entitlement = firstEntitlement(subscription)
  const limit = entitlement?.limits?.dailyAiQuestionLimit ?? planLimit(subscription.currentTier)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const periodEnd = entitlement?.period?.end ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
  return {
    periodStart,
    periodEnd,
    aiMessagesUsed: 0,
    aiMessagesLimit: limit,
    fileUploadsUsed: 0,
    fileUploadsLimit: entitlement?.effectivePlan === 'premium' ? 50 : entitlement?.effectivePlan === 'standard' ? 10 : 0,
    teacherHelpUsed: 0,
    teacherHelpLimit: entitlement?.effectivePlan === 'premium' ? 20 : entitlement?.effectivePlan === 'standard' ? 5 : 0,
  }
}

function mapFeatureAccess(subscription: ParentSubscription): FeatureAccess {
  const entitlement = firstEntitlement(subscription)
  const plan = entitlement?.effectivePlan ?? subscription.currentTier
  const billing = subscription.billing
  const blocked = Boolean(entitlement?.blockingReason || ['payment_failed', 'past_due', 'canceled'].includes(billing?.status ?? ''))
  return {
    canUseChat: !blocked,
    canUploadFiles: !blocked && plan !== 'free',
    canRequestTeacherHelp: !blocked && plan !== 'free',
    canViewParentReports: !blocked && plan !== 'free',
    reason: blocked
      ? {
          teacherHelp: entitlement?.supportExplanation ?? 'Billing needs attention before this feature is available.',
          fileUploads: entitlement?.supportExplanation ?? 'Billing needs attention before this feature is available.',
          parentReports: entitlement?.supportExplanation ?? 'Billing needs attention before this feature is available.',
        }
      : undefined,
  }
}

function firstEntitlement(subscription: ParentSubscription) {
  return subscription.effectiveEntitlements?.[0]
}

function billingStatusToSubscriptionStatus(billing?: SubscriptionBilling): Subscription['status'] {
  if (!billing) return 'trial'
  if (billing.status === 'active' || billing.status === 'manual_override') return 'active'
  if (billing.status === 'checkout_pending') return 'trial'
  if (billing.status === 'canceled') return 'expired'
  return 'inactive'
}

function tierToPlan(tier: SubscriptionTier): SubscriptionPlan {
  if (tier === 'premium') return 'tutor_supported'
  if (tier === 'standard') return 'family'
  return 'free_trial'
}

function planToTier(plan: SubscriptionPlan): SubscriptionTier {
  if (plan === 'tutor_supported') return 'premium'
  if (plan === 'student' || plan === 'family') return 'standard'
  return 'free'
}

function planLimit(tier: SubscriptionTier) {
  if (tier === 'premium') return 100
  if (tier === 'standard') return 30
  return 5
}
