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

export type ParentSubscription = {
  parentId: string
  currentTier: SubscriptionTier
  plans: Record<SubscriptionTier, SubscriptionPlanBenefits>
  pendingRequest?: SubscriptionRequest | null
}

export type CreateSubscriptionRequestInput = {
  requestType: SubscriptionRequestType
  requestedTier?: SubscriptionTier
  parentNote?: string
}

export type SubscriptionRequestListResponse = {
  items: SubscriptionRequest[]
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
