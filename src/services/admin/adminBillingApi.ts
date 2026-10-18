import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'
import type { CheckoutStatusResponse } from '@/services/billing/billingApi'

export type AdminCheckoutDetail = CheckoutStatusResponse & {
  billingState?: string
  commandState?: string
}

export async function getAdminCheckoutDetail(checkoutRef: string): Promise<AdminCheckoutDetail> {
  const response = await httpClient.get<AdminCheckoutDetail>(
    apiPath`/admin/billing/checkouts/${checkoutRef}`,
  )
  return response.data
}

export async function recheckAdminCheckout(checkoutRef: string): Promise<AdminCheckoutDetail> {
  const response = await httpClient.post<AdminCheckoutDetail>(
    apiPath`/admin/billing/checkouts/${checkoutRef}/recheck`,
    {},
  )
  return response.data
}
