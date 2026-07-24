import { CreditCard, MailWarning } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pricingPlans } from '@/components/pricing/pricingPlans'
import { useBillingUsageQuery } from '@/hooks/billing/useBillingUsageQuery'
import { useNotificationsQuery } from '@/hooks/notifications/useNotificationsQuery'
import { useAuthStore } from '@/store/authStore'
import type {
  BillingOverview,
  MaskedPaymentMethod,
  PaymentReminder,
} from '@/types/billing'
import type { NotificationEvent } from '@/types/notification'

const REMINDER_ROLES = new Set(['parent', 'student'])

export function PaymentMethodReminderBanner() {
  const user = useAuthStore((state) => state.user)
  const eligible = Boolean(user && REMINDER_ROLES.has(user.role))
  const notifications = useNotificationsQuery(eligible)
  const billing = useBillingUsageQuery()

  if (!eligible || !user) return null

  const notificationReminder = currentNotificationReminder(
    notifications.data?.items ?? [],
    user.id,
    user.role,
  )
  const billingReminder = user.role === 'parent' && billing.data
    ? reminderFromBillingOverview(billing.data)
    : null
  const reminder = notificationReminder ?? billingReminder
  const loading = notifications.isLoading
    || (user.role === 'parent' && billing.isLoading)

  if (reminder?.resolved) return null

  if (!reminder && loading) {
    return (
      <div
        className="mb-4 rounded-md border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground"
        data-testid="payment-reminder-loading"
        role="status"
      >
        Billing reminder is loading.
      </div>
    )
  }

  if (
    !reminder
    && notifications.isError
    && (user.role !== 'parent' || billing.isError)
  ) {
    return (
      <div
        className="mb-4 rounded-md border border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground"
        data-testid="payment-reminder-error"
        role="status"
      >
        Billing reminder is temporarily unavailable. Dashboard content remains available.
      </div>
    )
  }

  if (!reminder) return null

  return (
    <aside
      className="mb-4 flex flex-col gap-3 rounded-md border border-primary/25 bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center"
      data-testid="payment-method-reminder"
      role="status"
      aria-live="polite"
    >
      <CreditCard
        className="h-5 w-5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1" data-testid="payment-reminder-copy">
        <p className="font-semibold text-foreground">Payment method reminder</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {formatBillingState(reminder.billingState)} · {reminder.price.currency}{' '}
          {reminder.price.amount}/month · {formatBrand(reminder.paymentMethod.brand)} ending
          in {reminder.paymentMethod.lastFour} · expires{' '}
          {formatExpiry(reminder.paymentMethod)}. The family billing owner can update
          the payment method.
        </p>
        <DeliveryState reminder={reminder} />
      </div>
      {user.role === 'parent' && (
        <Link
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          to="/billing/payment-settings"
        >
          Billing
        </Link>
      )}
    </aside>
  )
}

function DeliveryState({ reminder }: { reminder: PaymentReminder }) {
  const email = reminder.delivery?.email

  return (
    <p className="mt-1 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
      {email === 'failed' && (
        <MailWarning className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        Available here in STOA.
        {email === 'failed' && ' Email delivery failed.'}
        {email === 'ineligible' && ' No billing email is required.'}
      </span>
    </p>
  )
}

function currentNotificationReminder(
  events: NotificationEvent[],
  userId: string,
  role: string,
) {
  return events
    .filter((event) =>
      event.recipientId === userId
      && event.recipientRole === role
      && event.targetType === 'billing_payment_method',
    )
    .map((event) => parsePaymentReminder(event.metadata.paymentReminder))
    .filter((reminder): reminder is PaymentReminder => Boolean(reminder))
    .sort((left, right) =>
      Date.parse(right.updatedAt ?? right.remindAt ?? '')
      - Date.parse(left.updatedAt ?? left.remindAt ?? ''),
    )
    .find((reminder) => !reminder.resolved) ?? null
}

function parsePaymentReminder(value: unknown): PaymentReminder | null {
  if (!isRecord(value) || typeof value.reminderId !== 'string') return null
  if (typeof value.billingState !== 'string' || !isRecord(value.price)) return null
  if (value.price.currency !== 'CHF' || !isSafeNumber(value.price.amount)) return null
  const paymentMethod = parseMaskedPaymentMethod(value.paymentMethod)
  if (!paymentMethod || typeof value.resolved !== 'boolean') return null
  const delivery = parseDelivery(value.delivery)

  return {
    reminderId: value.reminderId,
    billingState: value.billingState,
    price: { amount: value.price.amount, currency: 'CHF' },
    paymentMethod,
    resolved: value.resolved,
    ...(typeof value.remindAt === 'string' ? { remindAt: value.remindAt } : {}),
    ...(typeof value.expiresAt === 'string' ? { expiresAt: value.expiresAt } : {}),
    ...(typeof value.updatedAt === 'string' ? { updatedAt: value.updatedAt } : {}),
    ...(delivery ? { delivery } : {}),
  }
}

function reminderFromBillingOverview(
  overview: BillingOverview,
): PaymentReminder | null {
  const value = overview.paymentReminder
  if (!value) return null

  if ('paymentMethod' in value) return parsePaymentReminder(value)

  const plan = pricingPlans.find((candidate) => candidate.id === overview.effectivePlan)
  const paymentMethod = parseMaskedPaymentMethod({
    brand: value.brand,
    lastFour: value.last4,
    expiryMonth: value.expiryMonth,
    expiryYear: value.expiryYear,
  })
  if (!plan || !paymentMethod) return null

  return {
    reminderId: `billing-reminder-${value.reminderAt}`,
    billingState: overview.status,
    price: { amount: plan.priceMonthly, currency: 'CHF' },
    paymentMethod,
    resolved: false,
    remindAt: value.reminderAt,
    updatedAt: value.reminderAt,
  }
}

function parseMaskedPaymentMethod(value: unknown): MaskedPaymentMethod | null {
  if (!isRecord(value)) return null
  if (typeof value.brand !== 'string' || !/^[a-z0-9 _-]{1,32}$/i.test(value.brand)) {
    return null
  }
  if (typeof value.lastFour !== 'string' || !/^\d{4}$/.test(value.lastFour)) {
    return null
  }
  if (!isIntegerInRange(value.expiryMonth, 1, 12)) return null
  if (!isIntegerInRange(value.expiryYear, 2000, 9999)) return null

  return {
    brand: value.brand,
    lastFour: value.lastFour,
    expiryMonth: value.expiryMonth,
    expiryYear: value.expiryYear,
  }
}

function parseDelivery(value: unknown): PaymentReminder['delivery'] | null {
  if (!isRecord(value) || value.inApp !== 'active') return null
  if (!['sent', 'ineligible', 'failed'].includes(String(value.email))) return null
  return {
    inApp: 'active',
    email: value.email as 'sent' | 'ineligible' | 'failed',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum
}

function formatBillingState(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatBrand(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function formatExpiry(value: MaskedPaymentMethod) {
  return `${String(value.expiryMonth).padStart(2, '0')}/${value.expiryYear}`
}
