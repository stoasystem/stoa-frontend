import { ArrowRight, HelpCircle, MessageSquareText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { qaCategories } from '@/data/qaContent'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function QaPage() {
  const totalQuestions = qaCategories.reduce((sum, category) => sum + category.items.length, 0)

  return (
    <MarketingLayout>
      <PageContainer size="wide">
        <PageHeader
          eyebrow="Q&A"
          title="Clear answers for students, parents, and teachers"
          description="Common STOA questions are grouped by audience so pricing details, student workflows, parent visibility, and teacher responsibilities are not mixed across marketing pages."
          actions={<Badge variant="secondary">{totalQuestions} answers</Badge>}
          titleClassName="editorial-heading editorial-title-shell max-w-4xl text-4xl leading-tight md:text-6xl"
        />

        <section className="grid gap-4 rounded-lg border border-border/80 bg-card/70 p-4 md:grid-cols-4">
          {qaCategories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="group rounded-md border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/35 hover:bg-[hsl(var(--stoa-brand-burgundy-soft))]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{category.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.summary}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </a>
          ))}
        </section>

        <div className="grid gap-8">
          {qaCategories.map((category) => (
            <section id={category.id} key={category.id} className="scroll-mt-24">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="brand-section-kicker">{category.title}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">{category.summary}</h2>
                </div>
                <Badge variant="outline">{category.items.length} questions</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {category.items.map((item) => (
                  <Card key={item.question}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
                          <HelpCircle className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <CardTitle className="break-words text-base leading-6">{item.question}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="break-words text-sm leading-6 text-muted-foreground">
                      {item.answer}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-lg border border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Still have a question?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Contact STOA if your family, school, or teacher application needs a more specific answer.
                </p>
              </div>
            </div>
            <Button asChild className="premium-button-lift premium-primary-button hover:text-primary-foreground">
              <Link to="/contact">Contact STOA</Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    </MarketingLayout>
  )
}
