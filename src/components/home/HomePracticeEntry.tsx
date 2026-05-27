import { useTranslation } from 'react-i18next'
import { HomePracticePreview } from '@/components/home/HomePracticePreview'
import { PracticeEntryCard } from '@/components/home/PracticeEntryCard'
import { getStartPracticePath } from '@/lib/navigation'
import { useAuthStore } from '@/store/authStore'

export function HomePracticeEntry() {
  const { t } = useTranslation('home')
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const startPracticePath = getStartPracticePath(isAuthenticated ? user : null)

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <div className="grid gap-6 rounded-lg border border-border/70 bg-[hsl(var(--stoa-brand-warm-grey))] p-4 shadow-[var(--platform-shadow-soft)] lg:grid-cols-[0.68fr_1.32fr] lg:items-start lg:p-6">
        <PracticeEntryCard
          eyebrow={t('practiceEntry.eyebrow')}
          title={t('practiceEntry.title')}
          body={t('practiceEntry.body')}
          primaryCta={t('practiceEntry.primaryCta')}
          secondaryCta={t('practiceEntry.secondaryCta')}
          startPracticePath={startPracticePath}
        />
        <HomePracticePreview />
      </div>
    </section>
  )
}
