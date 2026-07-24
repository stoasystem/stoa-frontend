import type {
  BillingAllowance,
  BillingBeneficiary,
  BillingPlan,
  CheckoutCommand,
  CheckoutPublicOutcome,
  MaskedPaymentMethod,
  PaymentReminder,
  SubscriptionPlan,
} from '@/types/billing'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false

type Expect<Value extends true> = Value

export type CanonicalSubscriptionPlans = Expect<
  Equal<SubscriptionPlan, 'free_trial' | 'student' | 'teacher_supported' | 'family'>
>

export type CanonicalCheckoutOutcomes = Expect<
  Equal<CheckoutPublicOutcome, 'confirming' | 'active' | 'not_completed' | 'support_needed'>
>

export const freeTrialPlan: BillingPlan = {
  id: 'free_trial',
  name: 'Free Trial',
  priceMonthly: 0,
  currency: 'CHF',
  purchasable: false,
  audience: 'Families validating fit.',
  cta: 'Start free trial',
  features: [],
}

export const teacherSupportedPlan: BillingPlan = {
  id: 'teacher_supported',
  name: 'Teacher-supported Plan',
  priceMonthly: 89,
  currency: 'CHF',
  purchasable: true,
  audience: 'Families who want teacher support.',
  cta: 'Select teacher support',
  features: [],
}

// @ts-expect-error tutor_supported is not an active plan identity
export const legacyTutorPlan: SubscriptionPlan = 'tutor_supported'

// @ts-expect-error free_trial cannot be marked as purchasable
export const purchasableTrial: BillingPlan = { ...freeTrialPlan, purchasable: true }

export const billingBeneficiary: BillingBeneficiary = {
  beneficiaryId: 'student-1',
  displayName: 'Student',
  effectivePlan: 'teacher_supported',
}

export const billingAllowance: BillingAllowance = {
  allowanceWindow: {
    timeZone: 'Europe/Zurich',
    isoYear: 2026,
    isoWeek: 30,
    windowStart: '2026-07-19T22:00:00Z',
    windowEnd: '2026-07-26T22:00:00Z',
  },
  inputUsed: 100,
  inputRemaining: 900,
  inputLimit: 1_000,
  inputPercentUsed: 10,
  outputUsed: 20,
  outputRemaining: 180,
  outputLimit: 200,
  outputPercentUsed: 10,
  teacherCasesUsed: 1,
  teacherCasesRemaining: 1,
  teacherCasesLimit: 2,
}

export const maskedPaymentMethod: MaskedPaymentMethod = {
  brand: 'visa',
  lastFour: '4242',
  expiryMonth: 12,
  expiryYear: 2027,
}

export const paymentReminder: PaymentReminder = {
  reminderId: 'reminder-1',
  billingState: 'payment_method_expiring',
  price: { amount: 89, currency: 'CHF' },
  paymentMethod: maskedPaymentMethod,
  resolved: false,
}

export const checkoutCommand: CheckoutCommand = {
  checkoutRef: 'checkout-ref',
  stateVersion: 1,
  commandState: 'provider_session_open',
  publicOutcome: 'confirming',
  billingLifecycleState: 'no_paid_fact',
  entitlementState: 'inactive',
  targetPlanId: 'teacher_supported',
  beneficiaryIds: [billingBeneficiary.beneficiaryId],
  safeActions: ['recheck_payment', 'contact_support'],
  effectivePlanId: null,
  planVersion: null,
  allowanceVersion: null,
}

export const forbiddenPaymentMethod: MaskedPaymentMethod = {
  ...maskedPaymentMethod,
  // @ts-expect-error payment-capable card data is forbidden
  cvc: '123',
}
