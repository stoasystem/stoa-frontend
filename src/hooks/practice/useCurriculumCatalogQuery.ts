import { useQuery } from '@tanstack/react-query'
import { getCurriculumCatalog } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useCurriculumCatalogQuery({
  subjectId,
  gradeLevel,
  includePreview = false,
}: {
  subjectId?: string
  gradeLevel?: string
  includePreview?: boolean
} = {}) {
  return useQuery({
    queryKey: practiceQueryKeys.curriculumCatalog(subjectId, gradeLevel, includePreview),
    queryFn: () => getCurriculumCatalog({ subjectId, gradeLevel, includePreview }),
  })
}
