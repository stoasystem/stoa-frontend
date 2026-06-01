import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Clock, Search } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QuestionSetCard } from '@/components/question-bank/QuestionSetCard'
import { SubjectCard } from '@/components/question-bank/SubjectTopicCards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuestionBankOverviewQuery } from '@/hooks/questionBank/useQuestionBankOverviewQuery'
import { useQuestionBankSearchQuery } from '@/hooks/questionBank/useQuestionBankSearchQuery'
import {
  getQuestionBankMistakesPath,
  getQuestionBankSavedPath,
  getQuestionBankSetPath,
  getQuestionBankTopicPath,
} from '@/lib/questionBankRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function QuestionBankHomePage() {
  const [query, setQuery] = useState('')
  const overviewQuery = useQuestionBankOverviewQuery()
  const searchQuery = useQuestionBankSearchQuery(query)
  const overview = overviewQuery.data
  const hasSearch = query.trim().length > 1

  const searchSummary = useMemo(() => {
    const result = searchQuery.data
    if (!result) return 0
    return result.topics.length + result.sets.length + result.questions.length
  }, [searchQuery.data])

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Question Bank"
          title="Practice by subject, topic, and difficulty."
          description="Use the open exercise library when you want targeted practice outside the guided Practice Path."
        />

        <section className="rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-card)]">
          <label htmlFor="question-bank-search" className="text-sm font-semibold">Search questions, topics, or skills</label>
          <div className="mt-3 flex items-center gap-2 rounded-lg border bg-[hsl(var(--platform-surface-app))] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input
              id="question-bank-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try equation, fractions, speed, or angles"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            {hasSearch ? `${searchSummary} result${searchSummary === 1 ? '' : 's'} found` : 'Search uses the local question-bank library.'}
          </p>
        </section>

        {hasSearch && searchQuery.data && (
          <section className="space-y-4">
            <SectionHeader title={`Search results for "${query}"`} description="Open a topic, question set, or source set from the local library." />
            <div className="grid gap-4 lg:grid-cols-3">
              <SearchColumn title="Topics">
                {searchQuery.data.topics.map((topic) => (
                  <ResultLink key={topic.id} to={getQuestionBankTopicPath(topic.subjectId, topic.id)} title={topic.title} detail={topic.description} />
                ))}
              </SearchColumn>
              <SearchColumn title="Question sets">
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

        {overview?.continueSet && (
          <section className="rounded-lg border border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5 shadow-[var(--platform-shadow-card)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="brand-section-kicker">Continue Practice</p>
                <h2 className="mt-2 text-2xl font-semibold">{overview.continueSet.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {overview.continueSet.progress.answered} / {overview.continueSet.progress.total} completed · {overview.continueSet.estimatedMinutes} min set
                </p>
              </div>
              <Button asChild>
                <Link to={getQuestionBankSetPath(overview.continueSet.id)}>Resume</Link>
              </Button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <SectionHeader title="Subjects" description="Choose a subject, then narrow by topic and level." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview?.subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader title="Recommended for you" description="Targeted sets based on current practice activity." />
          <div className="grid gap-4 lg:grid-cols-2">
            {overview?.recommendedSets.map((set) => (
              <QuestionSetCard key={set.id} set={set} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
            <p className="brand-section-kicker">Mistakes to Review</p>
            <h2 className="mt-2 text-3xl font-semibold">{overview?.mistakesToReview ?? 0}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Rework the questions that still need another look.
            </p>
            <Button asChild className="mt-5 w-full">
              <Link to={getQuestionBankMistakesPath()}>Review Mistakes</Link>
            </Button>
          </div>
          <div className="rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="brand-section-kicker">Recent Practice</p>
                <h2 className="mt-2 text-xl font-semibold">Keep useful sets close</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={getQuestionBankSavedPath()}>
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  Saved
                </Link>
              </Button>
            </div>
            <div className="mt-4 divide-y">
              {overview?.recentPractice.map((set) => (
                <Link
                  key={set.id}
                  to={getQuestionBankSetPath(set.id)}
                  className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary"
                >
                  <span className="font-medium">{set.title}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {set.lastAttempt ? `${set.lastAttempt.score}/${set.lastAttempt.total}` : `${set.progress.answered}/${set.progress.total}`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </PageContainer>
    </DashboardLayout>
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
