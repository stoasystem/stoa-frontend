import { useQuery } from '@tanstack/react-query'
import { getPracticeMistakes } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeMistakesQuery() {
  return useQuery({
    queryKey: practiceQueryKeys.mistakes(),
    queryFn: getPracticeMistakes,
  })
}
