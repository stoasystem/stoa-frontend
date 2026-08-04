import { httpClient } from '@/services/api/httpClient'
import type { CheckoutStatusResponse } from '@/services/billing/billingApi'

export type AdminCheckoutDetail = CheckoutStatusResponse & {
  billingState?: string
  commandState?: string
}

export async function getAdminCheckoutDetail(checkoutRef: string): Promise<AdminCheckoutDetail> {
  const response = await httpClient.get<AdminCheckoutDetail>(
    `/admin/billing/checkouts/${encodeURIComponent(checkoutRef)}`,
  )
  return response.data
}

export async function recheckAdminCheckout(checkoutRef: string): Promise<AdminCheckoutDetail> {
  const response = await httpClient.post<AdminCheckoutDetail>(
    `/admin/billing/checkouts/${encodeURIComponent(checkoutRef)}/recheck`,
    {},
  )
  return response.data
}
