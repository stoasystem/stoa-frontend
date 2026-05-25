import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['home', 'common'])
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const learningHref = getLearningHref(isAuthenticated ? user?.role : null)
  const bullets = t('home:hero.bullets', { returnObjects: true }) as string[]

  return (
    <section className="mx-auto grid w-full min-w-0 min-h-[calc(100vh-4rem)] max-w-6xl gap-10 px-5 pb-12 pt-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pb-16 lg:pt-16">
      <div className="premium-reveal min-w-0 max-w-3xl">
        <Badge variant="secondary" className="mb-6 gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          {t('home:hero.eyebrow')}
        </Badge>
        <h1 className="editorial-heading editorial-title-shell break-words text-5xl font-semibold leading-[0.95] text-foreground sm:text-6xl lg:text-7xl">
          <span className="block">STOA</span>
          <span className="editorial-accent block">{t('home:hero.title')}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
          {t('home:hero.subtitle')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="premium-button-lift premium-primary-button h-12 rounded-full px-7 text-base">
            <Link to={learningHref}>
              {t('common:actions.startLearning')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            to="/how-it-works"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border/80 bg-card/60 px-6 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-card"
          >
            {t('home:hero.secondaryCta')}
          </Link>
        </div>
        <div className="mt-7 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          {bullets.map((item) => (
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
