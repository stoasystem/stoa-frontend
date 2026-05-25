import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HomeMagazineImage } from '@/components/home/HomeMagazineImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

function getLearningHref(role?: string | null) {
  if (role === 'student') return '/chat'
  if (role === 'parent') return '/parent'
  if (role === 'tutor') return '/tutor'
  if (role === 'admin') return '/admin'
  return '/login?next=/chat'
}

export function HomeHero() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const learningHref = getLearningHref(isAuthenticated ? user?.role : null)

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-10 px-5 pb-12 pt-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pb-16 lg:pt-16">
      <div className="premium-reveal max-w-3xl">
        <Badge variant="secondary" className="mb-6 gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          AI first, teacher when needed
        </Badge>
        <h1 className="text-[3rem] font-semibold leading-[0.95] tracking-normal text-foreground sm:text-[4.5rem] lg:text-[5.4rem]">
          STOA Learning Platform
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
          Instant homework help guided by AI, supported by real teachers, and visible to parents
          when progress matters.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="premium-button-lift premium-primary-button h-12 rounded-full px-7 text-base">
            <Link to={learningHref}>
              Start Learning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            to="/how-it-works"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border/80 bg-card/60 px-6 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-card"
          >
            See how STOA works
          </Link>
        </div>
        <div className="mt-7 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          {['Ask in seconds', 'AI explains first', 'Teacher help inside chat'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <HomeMagazineImage />
    </section>
  )
}
