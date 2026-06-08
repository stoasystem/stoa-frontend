import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import { createModerationReport, type ModerationReportInput } from '@/services/admin/adminApi'

export function useReportModerationCaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ModerationReportInput) => createModerationReport(input),
    onSuccess: (caseItem) => {
      toast.success(`Moderation case ${caseItem.case_id} opened`)
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationCases() })
    },
    onError: () => {
      toast.error('Could not submit moderation report')
    },
  })
}
