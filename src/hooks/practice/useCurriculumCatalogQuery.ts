import { useQuery } from '@tanstack/react-query'
import { getCurriculumCatalog } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useCurriculumCatalogQuery({
  subjectId,
  gradeLevel,
  includePreview = false,
  enabled = true,
}: {
  subjectId?: string
  gradeLevel?: string
  includePreview?: boolean
  /** False until what the filters depend on is known, so the catalog is not read twice (#416). */
  enabled?: boolean
} = {}) {
  return useQuery({
    queryKey: practiceQueryKeys.curriculumCatalog(subjectId, gradeLevel, includePreview),
    queryFn: () => getCurriculumCatalog({ subjectId, gradeLevel, includePreview }),
    enabled,
  })
}
