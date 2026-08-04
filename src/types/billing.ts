import type { SubscriptionPlan, SubscriptionStatus } from '@/types/user'

export type { SubscriptionPlan, SubscriptionStatus }

export type PurchasableSubscriptionPlan = Exclude<SubscriptionPlan, 'free_trial'>

type BillingPlanPrice = {
  free_trial: 0
  student: 29
  teacher_supported: 89
  family: 149
}

type BillingPlanBase = {
  name: string
  currency: 'CHF'
  recommended?: boolean
  audience: string
  cta: string
  features: string[]
}

export type BillingPlan = {
  [Plan in SubscriptionPlan]: BillingPlanBase & {
    id: Plan
    priceMonthly: BillingPlanPrice[Plan]
    purchasable: Plan extends 'free_trial' ? false : true
  }
}[SubscriptionPlan]

export type Subscription = {
  status: SubscriptionStatus
  plan: SubscriptionPlan
  currentPeriodEnd?: string
}

export type CheckoutPublicOutcome =
  | 'confirming'
  | 'active'
  | 'not_completed'
  | 'support_needed'

export type CheckoutCommandState =
  | 'intent_recorded'
  | 'provider_create_pending'
  | 'provider_session_open'
  | 'reconciling'
  | 'activation_recorded'
  | 'terminal_without_payment'
  | 'operator_attention_required'

export type BillingLifecycleState =
  | 'no_paid_fact'
  | 'initial_invoice_paid'
  | 'subscription_active'
  | 'grace_period'
  | 'ended'
  | 'provider_unknown'

export type EntitlementLifecycleState =
  | 'inactive'
  | 'active'
  | 'scheduled_end'
  | 'paused'

export type BillingSafeAction =
  | 'recheck_payment'
  | 'contact_support'
  | 'view_billing'
  | 'view_parent_home'
  | 'start_checkout'

export type CheckoutCommand = {
  checkoutRef: string
  stateVersion: number
  commandState: CheckoutCommandState
  publicOutcome: CheckoutPublicOutcome
  billingLifecycleState: BillingLifecycleState
  entitlementState: EntitlementLifecycleState
  targetPlanId: PurchasableSubscriptionPlan
  beneficiaryIds: string[]
  safeActions: BillingSafeAction[]
  effectivePlanId: SubscriptionPlan | null
  planVersion: number | null
  allowanceVersion: number | null
}

export type ZurichAllowanceWindow = {
  timeZone: 'Europe/Zurich'
  isoYear: number
  isoWeek: number
  windowStart: string
  windowEnd: string
}

export type BillingAllowance = {
  allowanceWindow: ZurichAllowanceWindow
  beneficiaryId?: string
  planId?: SubscriptionPlan
  allowanceVersion?: number
  inputUsed: number
  inputRemaining: number
  inputLimit: number
  inputPercentUsed: number
  outputUsed: number
  outputRemaining: number
  outputLimit: number
  outputPercentUsed: number
  teacherCasesUsed: number
  teacherCasesRemaining: number
  teacherCasesLimit: number
}

export type BillingBeneficiary = {
  beneficiaryId: string
  displayName: string
  effectivePlan: SubscriptionPlan
}

export type MaskedPaymentMethod = {
  brand: string
  lastFour: string
  expiryMonth: number
  expiryYear: number
}

export type PaymentReminder = {
  reminderId: string
  billingState: string
  price: {
    amount: number
    currency: 'CHF'
  }
  paymentMethod: MaskedPaymentMethod
  resolved: boolean
  remindAt?: string
  expiresAt?: string
  updatedAt?: string
  delivery?: {
    inApp: 'active'
    email: 'sent' | 'ineligible' | 'failed'
  }
}

export type BillingAllowanceWindow = {
  weekIdentity: string
  timezone: 'Europe/Zurich'
  utcStart: string
  utcEnd: string
  localStart: string
  localEnd: string
}

export type BillingOverview = {
  parentId: string
  effectivePlan: SubscriptionPlan
  beneficiaries: {
    studentId: string
    effectivePlan: Exclude<SubscriptionPlan, 'free_trial'>
  }[]
  allowanceWindow: BillingAllowanceWindow | null
  inputRemaining: Record<string, number>
  outputRemaining: Record<string, number>
  inputPercentUsed: Record<string, number>
  outputPercentUsed: Record<string, number>
  teacherCasesRemaining: {
    scope: 'none' | 'per_beneficiary' | 'shared_family'
    remaining: number | null
    limit: number
    byBeneficiary: Record<string, number>
  }
  paymentReminder: PaymentReminder | {
    brand: string
    last4: string
    expiryMonth: number
    expiryYear: number
    reminderAt: string
    status: 'pending' | 'notified'
  } | null
  supportActions: (
    | 'start_checkout'
    | 'view_billing'
    | 'go_home'
    | 'contact_support'
  )[]
  status: string
  subscriptionTier: string
  paymentMethodType: 'card' | 'twint' | null
}

export type FeatureAccess = {
  canUseChat: boolean
  canUploadFiles: boolean
  canRequestTeacherHelp: boolean
  canViewParentReports: boolean
  reason?: Record<string, string>
}
