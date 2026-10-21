import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addModerationCaseNote,
  getModerationCase,
  getModerationCases,
  updateModerationCase,
  type ModerationCaseListFilters,
  type ModerationCaseNoteInput,
  type ModerationCaseUpdateInput,
} from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminModerationCasesQuery(filters: ModerationCaseListFilters) {
  return useQuery({
    queryKey: [...adminQueryKeys.moderationCases(), filters],
    queryFn: () => getModerationCases(filters),
    retry: false,
  })
}

export function useAdminModerationCaseQuery(caseId: string | null) {
  return useQuery({
    queryKey: [...adminQueryKeys.moderationCases(), 'detail', caseId],
    queryFn: () => getModerationCase(caseId as string),
    enabled: Boolean(caseId),
    retry: false,
  })
}

export function useUpdateModerationCaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ModerationCaseUpdateInput) => updateModerationCase(input),
    // The case's detail is under this key too. Invalidated once more on its
    // own, its refetch was cancelled and the case read a second time (#416).
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationCases() })
    },
  })
}

export function useAddModerationCaseNoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ModerationCaseNoteInput) => addModerationCaseNote(input),
    // The case's detail is under this key too. Invalidated once more on its
    // own, its refetch was cancelled and the case read a second time (#416).
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationCases() })
    },
  })
}
