import { ArrowRight, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function HomeTeacherFallback() {
  const { t } = useTranslation('home')

  return (
    <section className="mx-auto grid w-full min-w-0 max-w-6xl gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-border/70 bg-[#152238] text-primary-foreground shadow-[0_24px_70px_hsl(217_45%_15%_/_0.14)] min-h-[24rem]">
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
          alt="Teacher helping a student with schoolwork"
          className="absolute inset-0 h-full w-full object-cover opacity-72"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(217_45%_15%_/_0.15),hsl(217_45%_15%_/_0.84))]" />
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/15 bg-[#152238]/86 p-5 backdrop-blur">
          <GraduationCap className="h-8 w-8 text-[#c2a15a]" />
          <p className="mt-5 text-2xl font-semibold leading-tight">
            {t('teacher.visualText')}
          </p>
        </div>
      </div>
      <div className="min-w-0 rounded-xl border border-border/70 bg-card/78 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
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
