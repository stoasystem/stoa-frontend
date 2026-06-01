import { useMutation } from '@tanstack/react-query'
import { createQuestionBankSession } from '@/services/questionBank/questionBankApi'

export function useCreateQuestionBankSessionMutation() {
  return useMutation({
    mutationFn: createQuestionBankSession,
  })
}
