import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  clearTerminalCheckoutOperation,
  createCheckoutSession,
  getCheckoutCommand,
  getCheckoutOperation,
  recheckCheckoutCommand,
  supersedeCheckoutCommand,
  type CheckoutSelection,
} from '@/services/billing/billingApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { PurchasablePlan } from '@/types/billing'

function generateIdempotencyKey(): string {
  const array = new Uint8Array(18)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export type CreateCheckoutInput = {
  plan: PurchasablePlan
  beneficiaryIds: string[]
}

export const checkoutIdentityHeader = 'Idempotency-Key' as const

export function useCreateCheckoutSessionMutation() {
  const queryClient = useQueryClient()
  const createInFlight = useRef(false)
  const [operation, setOperation] = useState(getCheckoutOperation)
  const commandQuery = useQuery({
    queryKey: ['billing', 'checkout-command', operation?.checkoutRef],
    queryFn: () => getCheckoutCommand(operation?.checkoutRef ?? ''),
    enabled: Boolean(operation?.checkoutRef),
    retry: false,
  })

  useEffect(() => {
    if (commandQuery.data?.newCheckoutAllowed) {
      clearTerminalCheckoutOperation(commandQuery.data.checkoutRef)
      setOperation(null)
    }
  }, [commandQuery.data])

  const createMutation = useMutation({
    mutationFn: async (input: CheckoutSelection | SubscriptionPlan) => {
      if (typeof input === 'string') {
        throw new Error('Select the beneficiaries for this checkout.')
      }
      if (createInFlight.current) {
        throw new Error('Checkout creation is already in progress.')
      }
      createInFlight.current = true
      trackEvent('checkout_started', { plan: input.plan, mode: 'hosted' })
      return createCheckoutSession(input)
    },
    onSuccess: (data) => {
      setOperation(getCheckoutOperation())
      if (data.checkoutUrl) window.location.assign(data.checkoutUrl)
    },
    onSettled: () => {
      createInFlight.current = false
    },
  })

  const recheckMutation = useMutation({
    mutationFn: () => {
      if (!operation?.checkoutRef) {
        throw new Error('No retained checkout is available to recheck.')
      }
      return recheckCheckoutCommand(operation.checkoutRef)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['billing', 'checkout-command', data.checkoutRef],
        data,
      )
    },
  })

  const supersedeMutation = useMutation({
    mutationFn: ({
      checkoutRef,
      selection,
    }: {
      checkoutRef: string
      selection: CheckoutSelection
    }) => supersedeCheckoutCommand(checkoutRef, selection),
    onSuccess: (data) => {
      setOperation(getCheckoutOperation())
      if (data.checkoutUrl) window.location.assign(data.checkoutUrl)
    },
  })

  return {
    ...createMutation,
    operation,
    commandQuery,
    recheckMutation,
    supersedeMutation,
  }
}
