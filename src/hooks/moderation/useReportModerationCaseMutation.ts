import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import { createModerationReport, type ModerationReportInput } from '@/services/admin/adminApi'

// The report is sent from a teacher's help request, so its words live next to
// the dialog's in `teacher:moderationReport` (#279).
export function useReportModerationCaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ModerationReportInput) => createModerationReport(input),
    onSuccess: (caseItem) => {
      toast.success(i18n.t('teacher:moderationReport.submitted', { caseId: caseItem.case_id }))
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationCases() })
    },
    onError: () => {
      toast.error(i18n.t('teacher:moderationReport.submitFailed'))
    },
  })
}
