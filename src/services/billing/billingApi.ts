import { httpClient } from '@/services/api/httpClient'
import { pricingPlans } from '@/components/pricing/pricingPlans'
import type {
  BillingSafeAction,
  CheckoutCommandState,
  CheckoutPublicOutcome,
  FeatureAccess,
  PurchasableSubscriptionPlan,
  Subscription,
  SubscriptionPlan,
} from '@/types/billing'
import type { ParentSubscription, SubscriptionTier } from '@/types/subscriptionOperations'

export const CHECKOUT_OPERATION_STORAGE_KEY = 'stoa.billing.checkout.v1'

export type CheckoutOperationStore = {
  idempotencyKey: string
  checkoutRef?: string
}

export type CheckoutSelection = {
  plan: PurchasableSubscriptionPlan
  beneficiaryIds: string[]
}

export type CheckoutCreateResponse = {
  checkoutRef: string
  commandState: CheckoutCommandState
  checkoutSessionId: string
  checkoutUrl: string
  safeActions: BillingSafeAction[]
  targetPlan: PurchasableSubscriptionPlan
  beneficiaries: string[]
}

export type CheckoutStatusResponse = {
  checkoutRef: string
  outcome: CheckoutPublicOutcome
  newCheckoutAllowed: boolean
  safeActions: BillingSafeAction[]
  targetPlan: PurchasableSubscriptionPlan
  beneficiaries: string[]
  effectivePlan: PurchasableSubscriptionPlan | null
  lastRecheckedAt: string
}

export type CheckoutSupersedeResponse = {
  checkoutRef: string | null
  commandState: CheckoutCommandState
  publicOutcome?: CheckoutPublicOutcome | null
  checkoutSessionId?: string | null
  checkoutUrl?: string | null
  safeActions: BillingSafeAction[]
  targetPlan?: PurchasableSubscriptionPlan | null
  beneficiaries?: string[]
}

export async function getBillingPlans() {
  return { items: pricingPlans }
}

export async function getSubscription(): Promise<Subscription> {
  const response = await httpClient.get<{
    effectivePlan: SubscriptionPlan
    status: string
  }>('/parents/me/subscription/billing')
  return {
    plan: response.data.effectivePlan,
    status: billingStatusToSubscriptionStatus({ status: response.data.status }),
    currentPeriodEnd: undefined,
  }
}

export async function getBillingUsage() {
  const response = await httpClient.get<ParentSubscription>('/parents/me/subscription')
  return mapBillingUsage(response.data)
}

export async function getFeatureAccess() {
  const response = await httpClient.get<ParentSubscription>('/parents/me/subscription')
  return mapFeatureAccess(response.data)
}

export function getCheckoutOperation(): CheckoutOperationStore | null {
  if (typeof window === 'undefined') return null
  const stored = window.sessionStorage.getItem(CHECKOUT_OPERATION_STORAGE_KEY)
  if (!stored) return null
  try {
    const value: unknown = JSON.parse(stored)
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
    const record = value as Record<string, unknown>
    if (typeof record.idempotencyKey !== 'string' || record.idempotencyKey.length < 8) return null
    if (record.checkoutRef !== undefined && typeof record.checkoutRef !== 'string') return null
    return {
      idempotencyKey: record.idempotencyKey,
      ...(record.checkoutRef ? { checkoutRef: record.checkoutRef } : {}),
    }
  } catch {
    return null
  }
}

export function getOrCreateCheckoutOperation(): CheckoutOperationStore {
  const current = getCheckoutOperation()
  if (current) return current
  const operation = { idempotencyKey: crypto.randomUUID() }
  storeCheckoutOperation(operation)
  return operation
}

export function clearTerminalCheckoutOperation(checkoutRef?: string): void {
  if (typeof window === 'undefined') return
  const current = getCheckoutOperation()
  if (!checkoutRef || current?.checkoutRef === checkoutRef) {
    window.sessionStorage.removeItem(CHECKOUT_OPERATION_STORAGE_KEY)
  }
}

export async function createCheckoutSession(selection: CheckoutSelection) {
  const operation = getOrCreateCheckoutOperation()
  if (operation.checkoutRef) {
    throw new Error('A checkout is already in progress.')
  }
  const response = await httpClient.post<CheckoutCreateResponse>(
    '/parents/me/subscription/checkout',
    {
      plan: selection.plan,
      beneficiaryIds: normalizedBeneficiaries(selection.beneficiaryIds),
    },
    {
      headers: { 'Idempotency-Key': operation.idempotencyKey },
    },
  )
  storeCheckoutOperation({
    idempotencyKey: operation.idempotencyKey,
    checkoutRef: response.data.checkoutRef,
  })
  return response.data
}

export async function getCheckoutCommand(checkoutRef: string) {
  const response = await httpClient.get<CheckoutStatusResponse>(
    `/parents/me/subscription/checkout/${encodeURIComponent(checkoutRef)}`,
  )
  return response.data
}

export async function recheckCheckoutCommand(checkoutRef: string) {
  const response = await httpClient.post<CheckoutStatusResponse>(
    `/parents/me/subscription/checkout/${encodeURIComponent(checkoutRef)}/recheck`,
    {},
  )
  return response.data
}

export async function supersedeCheckoutCommand(
  checkoutRef: string,
  selection: CheckoutSelection,
) {
  const current = getCheckoutOperation()
  if (current?.checkoutRef !== checkoutRef) {
    throw new Error('The retained checkout reference has changed.')
  }
  const successorKey = await successorIdempotencyKey(
    current.idempotencyKey,
    selection,
  )
  const response = await httpClient.post<CheckoutSupersedeResponse>(
    `/parents/me/subscription/checkout/${encodeURIComponent(checkoutRef)}/supersede`,
    {
      confirmed: true,
      plan: selection.plan,
      beneficiaryIds: normalizedBeneficiaries(selection.beneficiaryIds),
    },
    {
      headers: { 'Idempotency-Key': successorKey },
    },
  )
  if (response.data.checkoutRef) {
    storeCheckoutOperation({
      idempotencyKey: successorKey,
      checkoutRef: response.data.checkoutRef,
    })
  }
  return response.data
}

function storeCheckoutOperation(operation: CheckoutOperationStore): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(
    CHECKOUT_OPERATION_STORAGE_KEY,
    JSON.stringify({
      idempotencyKey: operation.idempotencyKey,
      ...(operation.checkoutRef ? { checkoutRef: operation.checkoutRef } : {}),
    }),
  )
}

function normalizedBeneficiaries(beneficiaryIds: string[]) {
  return [...new Set(beneficiaryIds)].sort()
}

async function successorIdempotencyKey(
  currentKey: string,
  selection: CheckoutSelection,
) {
  const intent = JSON.stringify({
    currentKey,
    plan: selection.plan,
    beneficiaryIds: normalizedBeneficiaries(selection.beneficiaryIds),
  })
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(intent),
  )
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
}

function mapBillingUsage(subscription: ParentSubscription) {
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

function billingStatusToSubscriptionStatus(
  billing?: { status: string },
): Subscription['status'] {
  if (!billing) return 'trial'
  if (billing.status === 'active' || billing.status === 'manual_override') return 'active'
  if (billing.status === 'checkout_pending') return 'trial'
  if (billing.status === 'canceled') return 'expired'
  return 'inactive'
}

function planLimit(tier: SubscriptionTier) {
  if (tier === 'premium') return 100
  if (tier === 'standard') return 30
  return 5
}
