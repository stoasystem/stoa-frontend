import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCheckoutCommand,
  recheckCheckoutCommand,
  type CheckoutStatusResponse,
} from '@/services/billing/billingApi'

export const checkoutConfirmingPollDelays = [500, 1_000, 1_500, 2_000] as const

function checkoutCommandQueryKey(checkoutRef: string) {
  return ['billing', 'checkout-command', checkoutRef] as const
}

export function useCheckoutCommandQuery(checkoutRef: string | null) {
  const normalizedRef = checkoutRef?.trim() ?? ''
  const [hasExhaustedAutoPolling, setHasExhaustedAutoPolling] = useState(false)
  const query = useQuery({
    queryKey: checkoutCommandQueryKey(normalizedRef),
    queryFn: () => getCheckoutCommand(normalizedRef),
    enabled: normalizedRef.length > 0,
    retry: false,
    refetchInterval: (currentQuery) => {
      const data = currentQuery.state.data as CheckoutStatusResponse | undefined
      if (data?.outcome !== 'confirming') return false
      return (
        checkoutConfirmingPollDelays[
          Math.max(currentQuery.state.dataUpdateCount - 1, 0)
        ] ?? false
      )
    },
    refetchIntervalInBackground: false,
  })

  useEffect(() => {
    setHasExhaustedAutoPolling(false)
    if (!normalizedRef) return
    const pollingWindow = checkoutConfirmingPollDelays.reduce(
      (total, delay) => total + delay,
      0,
    )
    const timeout = window.setTimeout(
      () => setHasExhaustedAutoPolling(true),
      pollingWindow + 250,
    )
    return () => window.clearTimeout(timeout)
  }, [normalizedRef])

  return {
    ...query,
    hasExhaustedAutoPolling:
      query.data?.outcome === 'confirming' && hasExhaustedAutoPolling,
  }
}

export function useRecheckCheckoutCommandMutation(checkoutRef: string | null) {
  const queryClient = useQueryClient()
  const normalizedRef = checkoutRef?.trim() ?? ''

  return useMutation({
    mutationFn: () => {
      if (!normalizedRef) {
        throw new Error('Checkout reference is required.')
      }
      return recheckCheckoutCommand(normalizedRef)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        checkoutCommandQueryKey(normalizedRef),
        data,
      )
    },
  })
}
