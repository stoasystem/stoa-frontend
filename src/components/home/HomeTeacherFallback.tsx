import { ArrowRight, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function HomeTeacherFallback() {
  const { t } = useTranslation('home')

  return (
    <section className="mx-auto grid w-full min-w-0 max-w-6xl gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div className="brand-image-panel relative min-w-0 overflow-hidden rounded-lg border border-border/70 text-primary-foreground min-h-[24rem]">
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
          alt="Teacher helping a student with schoolwork"
          className="absolute inset-0 h-full w-full object-cover opacity-72"
        />
        <div className="brand-image-overlay-vertical absolute inset-0" />
        <div className="brand-ink-card absolute bottom-5 left-5 right-5 rounded-lg border border-white/15 p-5 backdrop-blur">
          <GraduationCap className="h-8 w-8 text-[hsl(38_42%_72%)]" />
          <p className="mt-5 text-2xl font-semibold leading-tight">
            {t('teacher.visualText')}
          </p>
        </div>
      </div>
      <div className="min-w-0 rounded-lg border border-border/70 bg-card/78 p-6">
        <p className="brand-section-kicker">
          {t('teacher.eyebrow')}
        </p>
        <h2 className="editorial-heading editorial-title-shell mt-5 break-words text-4xl font-semibold leading-tight text-foreground">
          {t('teacher.title')}
        </h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          {t('teacher.body')}
        </p>
        <Link
          to="/teacher-support"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-[hsl(var(--accent))]"
        >
          {t('teacher.link')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
