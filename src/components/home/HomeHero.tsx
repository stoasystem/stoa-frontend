import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HomeMagazineImage } from '@/components/home/HomeMagazineImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getLocaleLayout } from '@/lib/localeLayout'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

function getLearningHref(role?: string | null) {
  if (role === 'student') return '/chat'
  if (role === 'parent') return '/parent'
  if (role === 'tutor') return '/tutor'
  if (role === 'admin') return '/admin'
  return '/login?next=/chat'
}

function getTitleLines(value: unknown, fallback: string) {
  if (Array.isArray(value)) {
    const lines = value.filter((line): line is string => typeof line === 'string' && line.trim().length > 0)

    if (lines.length > 0) {
      return lines
    }
  }

  return [fallback]
}

export function HomeHero() {
  const { i18n, t } = useTranslation(['home', 'common'])
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const learningHref = getLearningHref(isAuthenticated ? user?.role : null)
  const layout = getLocaleLayout(i18n.language)
  const title = t('home:hero.title')
  const titleLines = getTitleLines(t('home:hero.titleLines', { returnObjects: true }), title)
  const bullets = t('home:hero.bullets', { returnObjects: true }) as string[]
  const startLearningLabel =
    layout.ctaLabelVariant === 'shortOnMobile' ? (
      <>
        <span className="sm:hidden">{t('common:actions.startLearningShort')}</span>
        <span className="hidden sm:inline">{t('common:actions.startLearning')}</span>
      </>
    ) : (
      t('common:actions.startLearning')
    )

  return (
    <section className="mx-auto grid w-full min-w-0 min-h-[calc(100vh-4rem)] max-w-6xl gap-10 px-5 pb-12 pt-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pb-18 lg:pt-18">
      <div className="premium-reveal min-w-0 max-w-3xl">
        <Badge variant="secondary" className="mb-6 gap-2 rounded-md border border-border/70 bg-card/70 px-4 py-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          {t('home:hero.eyebrow')}
        </Badge>
        <h1
          className={cn(
            'editorial-heading editorial-title-shell break-words font-semibold leading-[0.95] text-foreground',
            layout.heroTitleClassName,
            layout.heroTitleMaxWidthClassName,
            layout.heroTitleVariant === 'stacked' && 'hero-title-stacked',
          )}
        >
          <span className="block">STOA</span>
          {titleLines.map((line) => (
            <span key={line} className="editorial-accent block">
              {line}
            </span>
          ))}
        </h1>
        <p className={cn('mt-6 text-lg leading-8 text-muted-foreground sm:text-xl', layout.heroSubtitleMaxWidthClassName)}>
          {t('home:hero.subtitle')}
        </p>
        <div className={cn('mt-8 flex flex-col gap-3 sm:flex-row sm:items-center', layout.heroActionClassName)}>
          <Button
            asChild
            size="lg"
            className={cn(
              'premium-button-lift premium-primary-button min-h-12 rounded-md px-7 py-3 text-base',
              layout.buttonSize === 'wide' && 'sm:px-8',
              layout.ctaButtonClassName,
            )}
          >
            <Link to={learningHref}>
              {startLearningLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            to="/how-it-works"
            className={cn(
              'inline-flex min-h-12 items-center justify-center rounded-md border border-border/80 bg-card/60 px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-[hsl(var(--stoa-brand-burgundy-soft))]',
              layout.buttonSize === 'wide' && 'sm:px-7',
            )}
          >
            {t('home:hero.secondaryCta')}
          </Link>
        </div>
        <div className="mt-7 grid min-w-0 gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          {bullets.map((item) => (
            <div key={item} className="flex min-w-0 items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span className="min-w-0 leading-5">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <HomeMagazineImage />
    </section>
  )
}
