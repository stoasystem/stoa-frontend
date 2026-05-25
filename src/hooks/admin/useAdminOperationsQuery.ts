import { useQuery } from '@tanstack/react-query'
import {
  getAdminBillingInterest,
  getAdminSupportRequests,
  getAdminSystemStatus,
  getAdminUsers,
} from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminUsersQuery() {
  return useQuery({ queryKey: [...adminQueryKeys.all, 'users'], queryFn: getAdminUsers, retry: false })
}

export function useAdminSupportRequestsQuery() {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'support'],
    queryFn: getAdminSupportRequests,
    retry: false,
  })
}

export function useAdminBillingInterestQuery() {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'billing-interest'],
    queryFn: getAdminBillingInterest,
    retry: false,
  })
}

export function useAdminSystemStatusQuery() {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'system'],
    queryFn: getAdminSystemStatus,
    retry: false,
  })
}
