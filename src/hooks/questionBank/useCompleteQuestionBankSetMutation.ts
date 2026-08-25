import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completeQuestionBankSet } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useCompleteQuestionBankSetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) => completeQuestionBankSet(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.all })
    },
  })
}
