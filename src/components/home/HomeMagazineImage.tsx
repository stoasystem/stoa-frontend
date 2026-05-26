import { MessageCircle, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const libraryStudyTableImageUrl = new URL('../../../img/library-study-table.jpeg', import.meta.url).href

export function HomeMagazineImage() {
  const { t } = useTranslation('home')

  return (
    <div className="premium-reveal-delay brand-image-panel relative min-w-0 min-h-[32rem] overflow-hidden rounded-[1.5rem] border border-border/70">
      <img
        src={libraryStudyTableImageUrl}
        alt="Quiet study table with open books in a library"
        className="absolute inset-0 h-full w-full object-cover opacity-72"
      />
      <div className="brand-image-overlay absolute inset-0" />
      <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase text-white/86 backdrop-blur">
        {t('hero.imageBadge')}
      </div>
      <div className="absolute bottom-5 left-5 right-5 grid gap-4 md:grid-cols-[1fr_0.78fr] md:items-end">
        <div className="rounded-lg border border-white/18 bg-white/88 p-4 text-[hsl(var(--stoa-brand-ink))] shadow-2xl backdrop-blur">
          <div className="brand-section-kicker flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('hero.imageLabel')}
          </div>
          <p className="mt-3 text-lg font-semibold leading-6">
            {t('hero.imageTitle')}
          </p>
          <div className="mt-4 rounded-md bg-[hsl(var(--stoa-brand-paper))] p-3 text-sm leading-6 text-muted-foreground">
            {t('hero.imagePrompt')}
          </div>
        </div>
        <div className="brand-ink-card rounded-lg border border-white/16 p-4 text-white shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4 text-[hsl(38_42%_72%)]" />
            {t('teacher.eyebrow')}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/75">
            {t('teacher.body')}
          </p>
        </div>
      </div>
    </div>
  )
}
