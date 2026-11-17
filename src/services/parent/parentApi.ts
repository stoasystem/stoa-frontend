import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'
import type { LearningProfile } from '@/types/learningProfile'
import type {
  ChildLearningHistoryResponse,
  ChildLearningSummary,
  ParentChild,
} from '@/types/parent'
import type { ParentAccountOperations } from '@/types/parentAccountOperations'
import type { ParentUsagePeriods } from '@/types/usagePeriod'
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

/** The parent's own usage period and each linked child's (#616, stoa-backend#343). */
export async function getParentUsagePeriod() {
  const response = await httpClient.get<ParentUsagePeriods>('/parents/me/usage-period')
  return response.data
}

export async function getChildLearningSummary(childId: string) {
  const response = await httpClient.get<ChildLearningSummary>(
    apiPath`/parents/me/children/${childId}/summary`,
  )
  return response.data
}

export async function getChildLearningHistory(childId: string) {
  const response = await httpClient.get<ChildLearningHistoryResponse>(
    apiPath`/parents/me/children/${childId}/history`,
  )
  return response.data
}

export async function getChildLearningProfile(childId: string) {
  const response = await httpClient.get<LearningProfile>(
    apiPath`/parents/me/children/${childId}/learning-profile`,
  )
  return response.data
}

/**
 * Whether this child may ask by voice (#697, stoa-backend#469): off until a
 * linked parent turns it on; any linked parent may change it, the last change
 * wins, and `changedByMe` says whether that was this parent.
 */
export type ChildVoiceQuestions = {
  studentId: string
  allowed: boolean
  changedAt?: string | null
  changedByMe?: boolean | null
}

export async function getChildVoiceQuestions(childId: string) {
  const response = await httpClient.get<ChildVoiceQuestions>(
    apiPath`/parents/me/children/${childId}/voice-questions`,
  )
  return response.data
}

export async function setChildVoiceQuestions(childId: string, allowed: boolean) {
  const response = await httpClient.put<ChildVoiceQuestions>(
    apiPath`/parents/me/children/${childId}/voice-questions`,
    { allowed },
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
