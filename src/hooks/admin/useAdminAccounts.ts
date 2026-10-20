import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  assignAccount,
  assignParentLink,
  changeAccountStatus,
  claimInvitation,
  inviteAccount,
  listAccounts,
  reissueInvitation,
  readTeacherSupportAllowance,
  resetAccountPassword,
  revokeInvitation,
  setTeacherSupportAllowance,
  updateAccountProfile,
  type AccountListFilters,
  type AccountListResponse,
} from '@/services/admin/accountsApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminAccountsQuery(filters: AccountListFilters) {
  return useQuery({
    queryKey: adminQueryKeys.accounts(filters),
    queryFn: ({ signal }) => listAccounts(filters, { signal }),
    retry: false,
  })
}

/**
 * The accounts page's list (#335): one query per filter, and the next one
 * keeps the previous answer on screen while it is read instead of flashing
 * "loading"; a superseded read is aborted rather than left to finish.
 *
 * Each page here is one budgeted walk of `listAccounts`. When a walk stops
 * with a continuation key still in hand, `hasNextPage` says so and
 * `fetchNextPage` carries on from it; the pages come back merged into one list.
 */
export function useAdminAccountListQuery(filters: AccountListFilters) {
  return useInfiniteQuery({
    queryKey: [...adminQueryKeys.accountsAll(), 'list', filters] as const,
    queryFn: ({ pageParam, signal }) =>
      listAccounts(filters, { signal, after: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: AccountListResponse) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    select: (data): AccountListResponse => {
      const groups: Record<string, number> = {}
      for (const page of data.pages) {
        for (const [role, count] of Object.entries(page.groups)) {
          groups[role] = (groups[role] ?? 0) + count
        }
      }
      const items = data.pages.flatMap((page) => page.items)
      return {
        items,
        count: items.length,
        groups,
        nextCursor: data.pages[data.pages.length - 1]?.nextCursor ?? null,
      }
    },
    retry: false,
  })
}

function useAccountMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.accountsAll() })
    },
  })
}

export function useInviteAccountMutation() {
  return useAccountMutation(inviteAccount)
}

export function useAssignAccountMutation() {
  return useAccountMutation(assignAccount)
}

export function useReissueInvitationMutation() {
  return useAccountMutation(reissueInvitation)
}

export function useRevokeInvitationMutation() {
  return useAccountMutation(revokeInvitation)
}

export function useResetAccountPasswordMutation() {
  return useAccountMutation(resetAccountPassword)
}

export function useChangeAccountStatusMutation() {
  return useAccountMutation(changeAccountStatus)
}

export function useUpdateAccountProfileMutation() {
  return useAccountMutation(updateAccountProfile)
}

export function useAssignParentLinkMutation() {
  return useAccountMutation(assignParentLink)
}

export function useTeacherSupportAllowanceQuery(studentId: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.teacherSupportAllowance(studentId ?? ''),
    queryFn: () => readTeacherSupportAllowance(studentId as string),
    enabled: Boolean(studentId),
    retry: false,
  })
}

export function useSetTeacherSupportAllowanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setTeacherSupportAllowance,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.teacherSupportAllowance(input.studentId),
      })
    },
  })
}

export function useClaimInvitationMutation() {
  return useMutation({ mutationFn: claimInvitation })
}
