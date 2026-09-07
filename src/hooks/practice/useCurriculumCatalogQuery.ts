import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: practiceQueryKeys.curriculumCatalog(subjectId, gradeLevel, includePreview, i18n.language),
    queryFn: () => getCurriculumCatalog({ subjectId, gradeLevel, includePreview }),
  })
}
