import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
} from '@/services/admin/accountsApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminAccountsQuery(filters: AccountListFilters) {
  return useQuery({
    queryKey: adminQueryKeys.accounts(filters),
    queryFn: () => listAccounts(filters),
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
