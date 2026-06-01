import { useMutation } from '@tanstack/react-query'
import { submitQuestionBankAnswer } from '@/services/questionBank/questionBankApi'

export function useSubmitQuestionBankAnswerMutation() {
  return useMutation({
    mutationFn: submitQuestionBankAnswer,
  })
}
