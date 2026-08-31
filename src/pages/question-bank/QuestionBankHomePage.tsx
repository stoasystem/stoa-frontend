/**
 * The Exercises tab: the one screen a student opens to decide what to do next.
 *
 * It used to stack seven equally weighted blocks — streak, continue, upload,
 * search, recommended, review, subjects — with the mistakes review appearing
 * three times over (a button in the streak bar, a "Review & Improve" block, and
 * the Mistakes tab above). Nothing said which one to press first.
 *
 * The order here is the order of the decision: finish what you started, clear
 * what is due, then look for something new. Uploading your own question is a
 * tool, so it sits at the end, and the mistakes review has exactly one entry
 * that leads to the Mistakes tab.
 */
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
import { getLearnMistakesPath } from '@/lib/learnRoutes'
import {
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
  const mistakesToReview = overview?.mistakesToReview ?? 0

  const searchSummary = useMemo(() => {
    const result = searchQuery.data
    if (!result) return 0
    return result.topics.length + result.sets.length + result.questions.length
  }, [searchQuery.data])

  function askWithQuestionUpload(attachments: UploadAttachment[]) {
    const uploadContext = {
      source: 'question-bank-upload' as const,
      title: t('learn.uploadTitle'),
      description: t('learn.uploadDescription'),
      prompt: t('learn.uploadPrompt'),
      returnTo: '/learn',
      attachments,
    }
    saveUploadHandoff(uploadContext)
    navigate('/chat?source=question-bank-upload', { state: { uploadContext } })
  }

  return (
    <PageContainer className="space-y-8 p-0">
      <PageHeader
        eyebrow={t('ui.practiceLibrary')}
        title={t('ui.practiceLibrary')}
        description={t('library.subtitle')}
      />

      {/* Status, not a task: one line, no action of its own. */}
      {overview && (
        <section className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/90 px-5 py-3 shadow-[var(--platform-shadow-soft)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <Flame className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold">
              {t('learn.streakDays', { count: overview.studyStreak })}
            </p>
            <p className="text-sm text-muted-foreground">
              {overview.studyStreak === 0
                ? t('learn.streakStart')
                : overview.practisedToday
                  ? t('learn.streakToday')
                  : t('learn.streakKeep')}
            </p>
          </div>
        </section>
      )}

      {/* ① Finish what is already open. */}
      {overview?.continueSet ? (
        <section className="rounded-lg border border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5 shadow-[var(--platform-shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="brand-section-kicker">{t('learn.continueEyebrow')}</p>
              <h2 className="mt-2 hyphens-auto break-words text-2xl font-semibold">
                {t('learn.continueTitle', { title: overview.continueSet.title })}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('learn.continueProgress', {
                  answered: overview.continueSet.progress.answered,
                  total: overview.continueSet.progress.total,
                  minutes: overview.continueSet.estimatedMinutes,
                })}
              </p>
            </div>
            <Button asChild className="w-full shrink-0 md:w-auto">
              <Link to={getQuestionBankSetPath(overview.continueSet.id)}>
                {t('learn.continueResume')}
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5 shadow-[var(--platform-shadow-card)]">
          <p className="brand-section-kicker">{t('learn.startEyebrow')}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t('learn.startTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('learn.startBody')}</p>
        </section>
      )}

      {/* ② What is due to come back. The one entry to the mistakes review. */}
      <section className="rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="brand-section-kicker">{t('learn.dueEyebrow')}</p>
            <h2 className="mt-2 text-xl font-semibold">
              {mistakesToReview > 0
                ? t('learn.dueTitle', { count: mistakesToReview })
                : t('learn.dueEmptyTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {mistakesToReview > 0 ? t('learn.dueBody') : t('learn.dueEmptyBody')}
            </p>
          </div>
          {mistakesToReview > 0 && (
            <Button asChild className="w-full shrink-0 md:w-auto">
              <Link to={getLearnMistakesPath()}>{t('learn.dueAction')}</Link>
            </Button>
          )}
        </div>
      </section>

      {/* ③ Looking for something new. */}
      <section className="rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-card)]">
        <SectionHeader title={t('ui.findExercises')} description={t('library.searchHint')} />
        <label htmlFor="question-bank-search" className="sr-only">
          {t('learn.searchLabel')}
        </label>
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
          {hasSearch
            ? t('learn.searchCount', { count: searchSummary })
            : t('learn.searchIdle')}
        </p>
      </section>

      {hasSearch && searchQuery.data && (
        <section className="space-y-4">
          <SectionHeader
            title={t('learn.searchResults', { query })}
            description={t('ui.openFromLibrary')}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <SearchColumn title={t('learn.searchTopics')}>
              {searchQuery.data.topics.map((topic) => (
                <ResultLink
                  key={topic.id}
                  to={getQuestionBankTopicPath(topic.subjectId, topic.id)}
                  title={topic.title}
                  detail={topic.description}
                />
              ))}
            </SearchColumn>
            <SearchColumn title={t('ui.questionSets')}>
              {searchQuery.data.sets.map((set) => (
                <ResultLink
                  key={set.id}
                  to={getQuestionBankSetPath(set.id)}
                  title={set.title}
                  detail={`${set.questionCount} · ${set.difficultyRange}`}
                />
              ))}
            </SearchColumn>
            <SearchColumn title={t('learn.searchQuestions')}>
              {searchQuery.data.questions.map((question) => (
                <ResultLink
                  key={question.id}
                  to={getQuestionBankSetPath(question.setId)}
                  title={question.prompt}
                  detail={question.skill}
                />
              ))}
            </SearchColumn>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeader
          title={
            overview?.recentPractice.length
              ? t('learn.recommendedTitle')
              : t('learn.recommendedTitleFresh')
          }
          description={
            overview?.recentPractice.length
              ? t('learn.recommendedBody')
              : t('learn.recommendedBodyFresh')
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {overview?.recommendedSets.map((set) => (
            <QuestionSetCard key={set.id} set={set} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title={t('ui.allSubjects')} description={t('ui.chooseSubjectHint')} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overview?.subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </section>

      {/* ④ A tool, not a step in the learning flow. */}
      <section className="rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="brand-section-kicker mt-4">{t('learn.uploadEyebrow')}</p>
            <h2 className="mt-2 text-xl font-semibold">{t('ui.uploadQuestion')}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('learn.uploadBody')}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 md:w-auto"
            onClick={() => setUploadOpen(true)}
          >
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
        sourceOptions={{ sourcePage: '/learn' }}
        onOpenChange={setUploadOpen}
        onComplete={askWithQuestionUpload}
      />
    </PageContainer>
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
