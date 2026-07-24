import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminBillingOperation,
  recheckAdminBillingOperation,
} from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export const adminBillingOperationKeys = {
  all: [...adminQueryKeys.all, 'billing/checkouts'] as const,
  detail: (parentId: string, checkoutRef: string) => [
    ...adminBillingOperationKeys.all,
    parentId,
    checkoutRef,
  ] as const,
}

export function useAdminBillingOperation(parentId: string, checkoutRef: string) {
  const queryClient = useQueryClient()
  const detailKey = adminBillingOperationKeys.detail(parentId, checkoutRef)
  const query = useQuery({
    queryKey: detailKey,
    queryFn: () => getAdminBillingOperation(checkoutRef, parentId),
    enabled: Boolean(parentId && checkoutRef),
    retry: false,
  })
  const recheck = useMutation({
    mutationFn: () => recheckAdminBillingOperation(checkoutRef, parentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: detailKey })
    },
  })

  return { query, recheck }
}
