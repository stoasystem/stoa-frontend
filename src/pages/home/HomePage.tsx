import { BookOpen, GraduationCap, MessagesSquare, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageShell } from '@/components/common/PageShell'
import { MarketingLayout } from '@/layouts/MarketingLayout'

const capabilities = [
  {
    title: 'AI Support',
    description: 'Students can ask questions and receive immediate help.',
    icon: MessagesSquare,
  },
  {
    title: 'Teacher Backup',
    description: 'Human tutors can step in when AI is not enough.',
    icon: GraduationCap,
  },
  {
    title: 'Parent Visibility',
    description: 'Parents can follow learning progress and student activity.',
    icon: Users,
  },
]

export function HomePage() {
  return (
    <MarketingLayout>
      <PageShell>
        <section className="grid gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-5 gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Phase 2 foundation
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
              STOA Learning Platform
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A modern AI learning platform foundation with routing, providers, reusable UI primitives,
              API structure, and state stores ready for product development.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/chat">Open Chat</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground">Foundation status</div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                <span>TailwindCSS</span>
                <span className="font-medium text-primary">Ready</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                <span>React Router</span>
                <span className="font-medium text-primary">Ready</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                <span>TanStack Query</span>
                <span className="font-medium text-primary">Ready</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-12 md:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon

            return (
              <Card key={capability.title}>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{capability.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {capability.description}
                </CardContent>
              </Card>
            )
          })}
        </section>
      </PageShell>
    </MarketingLayout>
  )
}
