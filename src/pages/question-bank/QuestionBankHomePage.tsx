import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Search } from 'lucide-react'
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
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function QuestionBankHomePage() {
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
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Practice Library"
          title="Practice Library"
          description="Choose exercises by subject, topic, and difficulty."
        />

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
              <h2 className="mt-2 text-xl font-semibold">Upload a Question</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Take a photo or attach a PDF from your schoolwork. It opens a guided Learning Assistant request, not an automatic scan.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => setUploadOpen(true)}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              Upload a Question
            </Button>
          </div>
        </section>
        <UploadModal
          open={uploadOpen}
          context="question_bank"
          title="Upload a Question"
          description="Take a photo or attach a PDF from your schoolwork. The Learning Assistant can help you understand it step by step."
          sourceOptions={{ sourcePage: '/question-bank' }}
          onOpenChange={setUploadOpen}
          onComplete={askWithQuestionUpload}
        />

        <section className="rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-card)]">
          <SectionHeader title="Find Exercises" description="Search by topic, skill, or question type, then narrow your practice." />
          <label htmlFor="question-bank-search" className="sr-only">Search questions, topics, or skills</label>
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
            {hasSearch ? `${searchSummary} result${searchSummary === 1 ? '' : 's'} found` : 'Search uses the local Practice Library.'}
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
          <SectionHeader title="All Subjects" description="Choose a subject, then narrow by topic and level." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview?.subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
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
