import { httpClient } from '@/services/api/httpClient'
import type { LearningProfile } from '@/types/learningProfile'
import type {
  ChildLearningHistoryResponse,
  ChildLearningSummary,
  ParentChild,
} from '@/types/parent'
import type { ParentAccountOperations } from '@/types/parentAccountOperations'
import type {
  CheckoutSession,
  CreateCheckoutSessionInput,
  CreateSubscriptionRequestInput,
  ParentSubscription,
  SubscriptionBilling,
  SubscriptionRequestListResponse,
} from '@/types/subscriptionOperations'

export async function getParentChildren() {
  const response = await httpClient.get<{ items: ParentChild[] }>('/parents/me/children')
  return response.data
}

export async function getChildLearningSummary(childId: string) {
  const response = await httpClient.get<ChildLearningSummary>(
    `/parents/me/children/${childId}/summary`,
  )
  return response.data
}

export async function getChildLearningHistory(childId: string) {
  const response = await httpClient.get<ChildLearningHistoryResponse>(
    `/parents/me/children/${childId}/history`,
  )
  return response.data
}

export async function getChildLearningProfile(childId: string) {
  const response = await httpClient.get<LearningProfile>(
    `/parents/me/children/${childId}/learning-profile`,
  )
  return response.data
}

export async function getParentSubscription() {
  const response = await httpClient.get<ParentSubscription>('/parents/me/subscription')
  return response.data
}

export async function createParentCheckoutSession(input: CreateCheckoutSessionInput) {
  const response = await httpClient.post<CheckoutSession>(
    '/parents/me/subscription/checkout',
    {
      requested_tier: input.requestedTier,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    },
  )
  return response.data
}

export async function getParentSubscriptionBilling() {
  const response = await httpClient.get<SubscriptionBilling>('/parents/me/subscription/billing')
  return response.data
}

export async function getParentAccountOperations() {
  const response = await httpClient.get<ParentAccountOperations>('/parents/me/account-operations')
  return response.data
}

export async function createParentSubscriptionRequest(input: CreateSubscriptionRequestInput) {
  const response = await httpClient.post(
    '/parents/me/subscription/requests',
    {
      request_type: input.requestType,
      requested_tier: input.requestedTier,
      parent_note: input.parentNote,
    },
  )
  return response.data
}

export async function getParentSubscriptionRequests() {
  const response = await httpClient.get<SubscriptionRequestListResponse>('/parents/me/subscription/requests')
  return response.data
}
