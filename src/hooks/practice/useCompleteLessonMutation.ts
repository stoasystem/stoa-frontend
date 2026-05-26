import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completePracticeLesson } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useCompleteLessonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completePracticeLesson,
    onSuccess: async (result) => {
      queryClient.setQueryData(practiceQueryKeys.lessonResult(result.lessonId), result)
      await queryClient.invalidateQueries({ queryKey: practiceQueryKeys.all })
    },
  })
}
