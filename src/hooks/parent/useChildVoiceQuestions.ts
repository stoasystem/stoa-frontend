import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getChildVoiceQuestions, setChildVoiceQuestions } from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

/** Whether this child may ask by voice (#697): off until a linked parent turns it on. */
export function useChildVoiceQuestionsQuery(childId: string | undefined) {
  return useQuery({
    queryKey: parentQueryKeys.childVoiceQuestions(childId ?? ''),
    queryFn: () => getChildVoiceQuestions(childId ?? ''),
    enabled: Boolean(childId),
  })
}

/** Turn it on or off; what the server answers stands, also who changed it and when. */
export function useSetChildVoiceQuestionsMutation(childId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (allowed: boolean) => setChildVoiceQuestions(childId ?? '', allowed),
    onSuccess: (saved) => {
      queryClient.setQueryData(parentQueryKeys.childVoiceQuestions(childId ?? ''), saved)
    },
  })
}
