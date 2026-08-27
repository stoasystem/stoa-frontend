import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Flame, Search } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QuestionSetCard } from '@/components/question-bank/QuestionSetCard'
import { SubjectCard } from '@/components/question-bank/SubjectTopicCards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadModal } from '@/features/uploads/components/UploadModal'
import { saveUploadHandoff } from '@/features/uploads/utils/uploadHandoff'
import type { UploadAttachment } from '@/features/uploads/types/uploads'
import { useQuestionBankOverviewQuery } from '@/hooks/questionBank/useQuestionBankOverviewQuery'
import { useQuestionBankSearchQuery } from '@/hooks/questionBank/useQuestionBankSearchQuery'
import {
  getQuestionBankMistakesPath,
  getQuestionBankSetPath,
  getQuestionBankTopicPath,
} from '@/lib/questionBankRoutes'

export function LibraryTab() {
  const { t } = useTranslation('practice')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const overviewQuery = useQuestionBankOverviewQuery()
  const searchQuery = useQuestionBankSearchQuery(query)
  const overview = overviewQuery.data
  const hasSearch = query.trim().length > 1

  const searchSummary = useMemo(() => {
    const result = searchQuery.data
    if (!result) return 0
    return result.topics.length + result.sets.length + result.questions.length
  }, [searchQuery.data])

  function askWithQuestionUpload(attachments: UploadAttachment[]) {
    const uploadContext = {
      source: 'question-bank-upload' as const,
      title: 'Upload a Question',
      description: 'Review the uploaded question with the Learning Assistant.',
      prompt: 'I uploaded a question from my own schoolwork. Please help me understand it step by step.',
      returnTo: '/question-bank',
      attachments,
    }
    saveUploadHandoff(uploadContext)
    navigate('/chat?source=question-bank-upload', { state: { uploadContext } })
  }

  return (
    <>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow={t('ui.practiceLibrary')}
          title={t('ui.practiceLibrary')}
          description={t('library.subtitle')}
        />

        {overview && (
          <section className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
                <Flame className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {overview.studyStreak} {overview.studyStreak === 1 ? 'day' : 'days'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overview.studyStreak === 0
                    ? 'Finish a set today to start a streak.'
                    : overview.practisedToday
                      ? 'Practised today. Come back tomorrow to keep it going.'
                      : 'Finish a set today to keep your streak.'}
                </p>
              </div>
            </div>
            {overview.mistakesToReview > 0 && (
              <Button asChild variant="outline">
                <Link to={getQuestionBankMistakesPath()}>
                  Review {overview.mistakesToReview} mistake
                  {overview.mistakesToReview === 1 ? '' : 's'}
                </Link>
              </Button>
            )}
          </section>
        )}

        {overview?.continueSet && (
          <section className="rounded-lg border border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5 shadow-[var(--platform-shadow-card)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="brand-section-kicker">Continue Practice</p>
                <h2 className="mt-2 text-2xl font-semibold">You started {overview.continueSet.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {overview.continueSet.progress.answered} of {overview.continueSet.progress.total} questions completed · about {overview.continueSet.estimatedMinutes} min
                </p>
              </div>
              <Button asChild>
                <Link to={getQuestionBankSetPath(overview.continueSet.id)}>Resume</Link>
              </Button>
            </div>
          </section>
        )}

        <section className="rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="brand-section-kicker mt-4">Have your own question?</p>
              <h2 className="mt-2 text-xl font-semibold">{t('ui.uploadQuestion')}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Take a photo or attach a PDF from your schoolwork. It opens a guided Learning Assistant request, not an automatic scan.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => setUploadOpen(true)}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              {t('ui.uploadQuestion')}
            </Button>
          </div>
        </section>
        <UploadModal
          open={uploadOpen}
          context="question_bank"
          title={t('ui.uploadQuestion')}
          description={t('ui.uploadBody2')}
          sourceOptions={{ sourcePage: '/question-bank' }}
          onOpenChange={setUploadOpen}
          onComplete={askWithQuestionUpload}
        />

        <section className="rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-card)]">
          <SectionHeader title={t('ui.findExercises')} description={t('library.searchHint')} />
          <label htmlFor="question-bank-search" className="sr-only">Search questions, topics, or skills</label>
          <div className="mt-3 flex items-center gap-2 rounded-lg border bg-[hsl(var(--platform-surface-app))] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input
              id="question-bank-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('ui.searchPlaceholder')}
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            {hasSearch ? `${searchSummary} result${searchSummary === 1 ? '' : 's'} found` : 'Search the exercises in your curriculum.'}
          </p>
        </section>

        {hasSearch && searchQuery.data && (
          <section className="space-y-4">
            <SectionHeader title={`Search results for "${query}"`} description={t('ui.openFromLibrary')} />
            <div className="grid gap-4 lg:grid-cols-3">
              <SearchColumn title="Topics">
                {searchQuery.data.topics.map((topic) => (
                  <ResultLink key={topic.id} to={getQuestionBankTopicPath(topic.subjectId, topic.id)} title={topic.title} detail={topic.description} />
                ))}
              </SearchColumn>
              <SearchColumn title={t('ui.questionSets')}>
                {searchQuery.data.sets.map((set) => (
                  <ResultLink key={set.id} to={getQuestionBankSetPath(set.id)} title={set.title} detail={`${set.questionCount} questions · ${set.difficultyRange}`} />
                ))}
              </SearchColumn>
              <SearchColumn title="Questions">
                {searchQuery.data.questions.map((question) => (
                  <ResultLink key={question.id} to={getQuestionBankSetPath(question.setId)} title={question.prompt} detail={question.skill} />
                ))}
              </SearchColumn>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <SectionHeader title={overview?.recentPractice.length ? 'Recommended for You' : 'Recommended to Start'} description={overview?.recentPractice.length ? 'Based on your recent practice.' : 'Begin with these core exercises.'} />
          <div className="grid gap-4 lg:grid-cols-2">
            {overview?.recommendedSets.map((set) => (
              <QuestionSetCard key={set.id} set={set} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
          <p className="brand-section-kicker">Review & Improve</p>
          <h2 className="mt-2 text-3xl font-semibold">{overview?.mistakesToReview ?? 0}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Revisit questions you missed before.
          </p>
          <Button asChild className="mt-5">
            <Link to={getQuestionBankMistakesPath()}>Review Mistakes</Link>
          </Button>
        </section>

        <section className="space-y-4">
          <SectionHeader title={t('ui.allSubjects')} description={t('ui.chooseSubjectHint')} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview?.subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        </section>
      </PageContainer>
    </>
  )
}

function SearchColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card/90 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  )
}

function ResultLink({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Link to={to} className="block rounded-md border bg-[hsl(var(--platform-surface-app))] p-3 hover:border-primary/35">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </Link>
  )
}

