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
    onSuccess: (caseItem) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationCases() })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.moderationCases(), 'detail', caseItem.case_id],
      })
    },
  })
}

export function useAddModerationCaseNoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ModerationCaseNoteInput) => addModerationCaseNote(input),
    onSuccess: (caseItem) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationCases() })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.moderationCases(), 'detail', caseItem.case_id],
      })
    },
  })
}
