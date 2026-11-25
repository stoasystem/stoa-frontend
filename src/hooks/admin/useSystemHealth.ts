import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import {
  getSystemFeature,
  getSystemHealth,
  type SystemFeatureKey,
  type SystemWindow,
} from '@/services/admin/systemHealthApi'

export const SYSTEM_HEALTH_REFRESH_MS = 60_000

export function useSystemHealthQuery(window: SystemWindow) {
  return useQuery({
    queryKey: adminQueryKeys.systemHealth(window),
    queryFn: ({ signal }) => getSystemHealth(window, signal),
    refetchInterval: SYSTEM_HEALTH_REFRESH_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  })
}

export function useSystemFeatureQuery(feature: SystemFeatureKey | null, window: SystemWindow) {
  return useQuery({
    queryKey: adminQueryKeys.systemFeature(feature ?? '', window),
    queryFn: ({ signal }) => getSystemFeature(feature as SystemFeatureKey, window, signal),
    enabled: feature !== null,
    refetchInterval: SYSTEM_HEALTH_REFRESH_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  })
}
