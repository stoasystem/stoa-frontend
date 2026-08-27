/**
 * One place to practise.
 *
 * The library and the guided path read the same curriculum, so they were two
 * entries onto the same content. They are tabs here, with the mistakes worth
 * revisiting beside them.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PracticePathTab } from '@/pages/practice/PracticeOverviewPage'
import { LibraryTab } from '@/pages/question-bank/QuestionBankHomePage'
import { ProgressTab } from '@/pages/learning-history/StudentLearningHistoryPage'
import { MistakesTab } from '@/pages/question-bank/MistakesReviewPage'

const TABS = ['library', 'path', 'mistakes', 'progress'] as const
type LearnTab = (typeof TABS)[number]

function isLearnTab(value: string | undefined): value is LearnTab {
  return TABS.includes(value as LearnTab)
}

export function LearnPage() {
  const { t } = useTranslation('practice')
  const { tab } = useParams()
  const navigate = useNavigate()
  const active: LearnTab = isLearnTab(tab) ? tab : 'library'

  return (
    <DashboardLayout>
      <Tabs
        value={active}
        onValueChange={(next) => navigate(next === 'library' ? '/learn' : `/learn/${next}`)}
        className="space-y-6"
      >
        <TabsList className="grid h-auto w-full grid-cols-4 sm:w-auto">
          <TabsTrigger value="library">{t('review.tabs.exercises')}</TabsTrigger>
          <TabsTrigger value="path">{t('review.tabs.path')}</TabsTrigger>
          <TabsTrigger value="mistakes">{t('review.tabs.mistakes')}</TabsTrigger>
          <TabsTrigger value="progress">{t('review.tabs.progress')}</TabsTrigger>
        </TabsList>
        <TabsContent value="library" className="mt-0">
          <LibraryTab />
        </TabsContent>
        <TabsContent value="path" className="mt-0">
          <PracticePathTab />
        </TabsContent>
        <TabsContent value="mistakes" className="mt-0">
          <MistakesTab />
        </TabsContent>
        <TabsContent value="progress" className="mt-0">
          <ProgressTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
