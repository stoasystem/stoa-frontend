export type SubscriptionTier = 'free' | 'standard' | 'premium'

export type SubscriptionRequestType = 'upgrade' | 'downgrade' | 'cancel'

export type SubscriptionRequestStatus =
  | 'requested'
  | 'in_review'
  | 'approved'
  | 'applied'
  | 'rejected'
  | 'cancelled'

export type SubscriptionPlanBenefits = {
  label: string
  dailyAiQuestionLimit: number
  teacherSupport: string
  weeklyReport: string
}

export type SubscriptionRequestEvent = {
  eventId: string
  eventAt: string
  eventType: string
  actorId?: string | null
  actorRole?: string | null
  note?: string | null
  changes?: Record<string, unknown>
}

export type SubscriptionRequest = {
  requestId: string
  parentId: string
  studentId?: string | null
  currentTier: SubscriptionTier
  requestedTier: SubscriptionTier
  requestType: SubscriptionRequestType
  status: SubscriptionRequestStatus
  source: string
  parentNote?: string | null
  adminNote?: string | null
  createdAt: string
  updatedAt: string
  effectiveAt?: string | null
  appliedAt?: string | null
  appliedBy?: string | null
  history: SubscriptionRequestEvent[]
}

export type SubscriptionBillingStatus =
  | 'none'
  | 'checkout_pending'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'payment_failed'
  | 'manual_override'
  | 'provider_unknown'

export type SubscriptionBillingEvent = {
  eventId: string
  eventAt: string
  eventType: string
  provider?: string | null
  providerMode?: string | null
  billingStatus?: SubscriptionBillingStatus | string | null
  requestedTier?: SubscriptionTier | null
  providerEventId?: string | null
}

export type SubscriptionBilling = {
  parentId: string
  provider?: string | null
  mode: 'manual' | 'test' | 'live' | string
  status: SubscriptionBillingStatus
  subscriptionTier: SubscriptionTier
  requestedTier?: SubscriptionTier | null
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
  providerPriceId?: string | null
  checkoutSessionId?: string | null
  checkoutUrl?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd: boolean
  lastProviderEventId?: string | null
  lastProviderEventType?: string | null
  lastProviderEventAt?: string | null
  manualOverrideAt?: string | null
  manualOverrideBy?: string | null
  manualOverrideSource?: string | null
  updatedAt?: string | null
  events?: SubscriptionBillingEvent[]
}

export type ParentSubscription = {
  parentId: string
  currentTier: SubscriptionTier
  plans: Record<SubscriptionTier, SubscriptionPlanBenefits>
  pendingRequest?: SubscriptionRequest | null
  billing?: SubscriptionBilling
}

export type CreateSubscriptionRequestInput = {
  requestType: SubscriptionRequestType
  requestedTier?: SubscriptionTier
  parentNote?: string
}

export type CreateCheckoutSessionInput = {
  requestedTier: SubscriptionTier
  successUrl?: string
  cancelUrl?: string
}

export type CheckoutSession = {
  parentId: string
  checkoutSessionId: string
  checkoutUrl: string
  provider: string
  mode: string
  requestedTier: SubscriptionTier
  billingStatus: SubscriptionBillingStatus
}

export type SubscriptionRequestListResponse = {
  items: SubscriptionRequest[]
  count: number
}

export type SubscriptionBillingListResponse = {
  items: SubscriptionBilling[]
  count: number
}

export type SubscriptionRequestFilters = {
  status?: SubscriptionRequestStatus | ''
  requestedTier?: SubscriptionTier | ''
  parentId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}
