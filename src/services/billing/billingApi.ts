import { httpClient } from '@/services/api/httpClient'
import {
  mockBillingPlans,
  mockBillingUsage,
  mockFeatureAccess,
  mockSubscription,
} from '@/data/phase11MockData'
import { getStoredUTM } from '@/lib/utm'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { BillingUsage, FeatureAccess, Subscription, SubscriptionPlan } from '@/types/billing'

export async function getBillingPlans() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: typeof mockBillingPlans }>('/billing/plans')
    return response.data
  }, { items: mockBillingPlans })
}

export async function getSubscription() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<Subscription>('/billing/subscription')
    return response.data
  }, mockSubscription)
}

export async function getBillingUsage() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<BillingUsage>('/billing/usage')
    return response.data
  }, mockBillingUsage)
}

export async function getFeatureAccess() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<FeatureAccess>('/billing/feature-access')
    return response.data
  }, mockFeatureAccess)
}

export async function createCheckoutSession(plan: SubscriptionPlan) {
  const response = await httpClient.post<{ checkoutUrl: string }>(
    '/billing/checkout-session',
    { plan, utm: getStoredUTM() },
  )
  return response.data
}
