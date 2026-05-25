export type UserRole = 'student' | 'parent' | 'tutor' | 'admin'

export type SubscriptionPlan = 'pilot' | 'family' | 'school' | 'enterprise'

export type BillingStatus =
  | 'not_configured'
  | 'pilot_access'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'

export type UserSubscription = {
  plan: SubscriptionPlan
  status: BillingStatus
  currentPeriodEndsAt?: string
}

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  subscription?: UserSubscription
}

export type AuthResponse = {
  accessToken: string
  user: User
}
