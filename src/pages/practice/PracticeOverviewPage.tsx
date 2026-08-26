import { useNavigate } from 'react-router-dom'
import { PracticeOverview } from '@/components/practice/PracticeOverview'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import { InlineUploadPanel } from '@/features/uploads/components/InlineUploadPanel'
import { saveUploadHandoff } from '@/features/uploads/utils/uploadHandoff'
import type { UploadAttachment } from '@/features/uploads/types/uploads'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useCurriculumProgressQuery } from '@/hooks/practice/useCurriculumProgressQuery'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'

export function PracticePathTab() {
  const navigate = useNavigate()
  const overviewQuery = usePracticeOverviewQuery()
  const curriculumQuery = useCurriculumCatalogQuery()
  const curriculumProgressQuery = useCurriculumProgressQuery()

  function askWithPracticeUpload(attachments: UploadAttachment[]) {
    const uploadContext = {
      source: 'practice-upload' as const,
      title: 'Practice schoolwork upload',
      description: 'Bring your own schoolwork into the Learning Assistant.',
      prompt: 'I uploaded a schoolwork question. Please guide me step by step and help me understand the unclear part.',
      returnTo: '/practice',
      attachments,
    }
    saveUploadHandoff(uploadContext)
    navigate('/chat?source=practice-upload', { state: { uploadContext } })
  }

  return (
    <>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Practice Path"
          title="Guided practice"
          description="Short challenges for school topics, with hints and a place to ask when a step is unclear."
        />
        <InlineUploadPanel
          context="practice_path"
          title="Bring your own schoolwork"
          description="Upload a question from school and ask the Learning Assistant for step-by-step guidance."
          sourceOptions={{ sourcePage: '/practice' }}
          compact
          onAskLearningAssistant={askWithPracticeUpload}
        />
        <CurriculumRolloutPanel
          catalog={curriculumQuery.data}
          progress={curriculumProgressQuery.data}
          isLoading={curriculumQuery.isLoading || curriculumProgressQuery.isLoading}
          isError={curriculumQuery.isError || curriculumProgressQuery.isError}
          contextLabel="Student curriculum"
        />
        {overviewQuery.isLoading && <PageSkeleton rows={4} />}
        {overviewQuery.isError && <p className="text-sm text-destructive">Practice is unavailable right now.</p>}
        {overviewQuery.data && <PracticeOverview overview={overviewQuery.data} />}
      </PageContainer>
    </>
  )
}

