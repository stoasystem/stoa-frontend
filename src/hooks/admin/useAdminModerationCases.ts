import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addModerationCaseNote,
  getModerationCase,
  getModerationCaseImage,
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

/**
 * The image an `image_upload` case refused (#538), read only while that case is
 * open on screen. Nothing is kept: once the case leaves the screen its bytes go
 * with it (`gcTime: 0`), and the next look reads them again. While open, it
 * is read once: a note or a status change refreshes the cases, a language
 * switch every query, and `'static'` keeps the image out of both. A 404 is
 * final: the image was deleted.
 */
export function useAdminModerationCaseImageQuery(caseId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.moderationCaseImage(caseId),
    queryFn: () => getModerationCaseImage(caseId),
    enabled,
    staleTime: 'static',
    gcTime: 0,
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
