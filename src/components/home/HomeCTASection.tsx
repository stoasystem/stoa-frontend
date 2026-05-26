import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getLocaleLayout } from '@/lib/localeLayout'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

function getHref(role?: string | null) {
  if (role === 'student') return '/chat'
  if (role === 'parent') return '/parent'
  if (role === 'tutor') return '/tutor'
  if (role === 'admin') return '/admin'
  return '/login?next=/chat'
}

export function HomeCTASection() {
  const { i18n, t } = useTranslation(['home', 'common'])
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const layout = getLocaleLayout(i18n.language)
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
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-6">
      <div className="rounded-lg bg-[hsl(var(--stoa-brand-charcoal))] p-7 text-primary-foreground md:p-10">
        <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="brand-section-kicker text-[hsl(var(--stoa-brand-warm-grey))]">
              {t('home:cta.eyebrow')}
            </p>
            <h2 className="editorial-heading mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              {t('home:cta.title')}
            </h2>
          </div>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className={cn(
              'premium-button-lift premium-light-button h-12 bg-[hsl(var(--stoa-brand-paper))] px-7 hover:bg-[hsl(var(--stoa-brand-card))]',
              layout.ctaButtonClassName,
            )}
          >
            <Link to={getHref(isAuthenticated ? user?.role : null)}>
              {startLearningLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
