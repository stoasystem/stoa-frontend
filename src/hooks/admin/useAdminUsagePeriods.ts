import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { afterUsagePeriodChange } from '@/hooks/admin/accountListCache'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import {
  ENDING_WITHIN_DAYS,
  extendUsagePeriod,
  listEndingUsagePeriods,
  readUsagePeriod,
  setUsagePeriodEnd,
  type UsagePeriodChange,
  type UsagePeriodRead,
} from '@/services/admin/usagePeriodApi'

/**
 * The account's period with its records as one read (#614).
 *
 * Each page carries the account's current end date and version along with a
 * page of records. The fields of the page read last are the ones that hold:
 * a "load more" after somebody else's write brings the newer version, and a
 * refetch reads the pages again in order.
 */
function mergePages(data: InfiniteData<UsagePeriodRead, string | undefined>): UsagePeriodRead {
  const last = data.pages[data.pages.length - 1]
  return {
    ...last,
    records: data.pages.flatMap((page) => page.records),
  }
}

export function useUsagePeriodQuery(userId: string | null) {
  return useInfiniteQuery({
    queryKey: adminQueryKeys.usagePeriod(userId ?? ''),
    queryFn: ({ pageParam, signal }) => readUsagePeriod(userId as string, { pageToken: pageParam, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: UsagePeriodRead) => last.nextPageToken ?? undefined,
    select: mergePages,
    enabled: Boolean(userId),
    retry: false,
  })
}

export function useEndingUsagePeriodsQuery(endingWithinDays = ENDING_WITHIN_DAYS) {
  return useQuery({
    queryKey: adminQueryKeys.endingUsagePeriods(endingWithinDays),
    queryFn: ({ signal }) => listEndingUsagePeriods(endingWithinDays, signal),
    retry: false,
  })
}

/**
 * After a write: this account's read and every other period read go again (a
 * parent's write moves each child's period in force, and the ending-soon list
 * may gain or lose the account), and the account lists show the new end date.
 */
function afterWrite(queryClient: QueryClient, result: UsagePeriodChange) {
  afterUsagePeriodChange(queryClient, { userId: result.userId, endsOn: result.endsOn })
  void queryClient.invalidateQueries({ queryKey: adminQueryKeys.usagePeriodsAll() })
}

export function useExtendUsagePeriodMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: extendUsagePeriod,
    onSuccess: (result) => afterWrite(queryClient, result),
  })
}

export function useSetUsagePeriodEndMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setUsagePeriodEnd,
    onSuccess: (result) => afterWrite(queryClient, result),
  })
}

/** Somebody else changed the period: read it again, so the next try carries their version. */
export function useReloadUsagePeriod() {
  const queryClient = useQueryClient()
  return (userId: string) =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.usagePeriod(userId) })
}
