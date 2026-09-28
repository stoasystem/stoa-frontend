import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AskHost } from '@/features/ask/AskHost'
import type { AskRoute } from '@/features/ask/useAskController'
import { AppLayout } from '@/layouts/AppLayout'

/**
 * A planet page: the planet on the sky, with Ask docked below it (#49).
 *
 * The planet itself is still a placeholder: the renderer (#47) goes where
 * `PlanetPlaceholder` is. The page area bleeds to the edges and the Ask host
 * paints the sky, so the planet goes inside `AskHost`, not in an
 * `AppLayout surface="sky"` of its own (the panel is a light surface and must
 * not sit inside the sky's token scope).
 */
export function PlanetScreen({ titleKey, ask }: { titleKey?: string; ask?: AskRoute }) {
  const { subjectId } = useParams()

  return (
    <AppLayout bleed>
      <AskHost route={ask} subjectId={subjectId}>
        <PlanetPlaceholder titleKey={titleKey} />
      </AskHost>
    </AppLayout>
  )
}

/** Says which layer this is and where it was opened, so a deep link is visibly intact. */
function PlanetPlaceholder({ titleKey }: { titleKey?: string }) {
  const { t } = useTranslation('common')
  const params = useParams()
  const entries = Object.entries(params).filter(([name]) => name !== '*' && name !== 'conversationId')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 pb-32 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.6px] text-[color:var(--on-sky-text-caption)]">
        {t('studentRoutes.placeholder.eyebrow')}
      </p>
      <h1 className="text-[26px] font-bold tracking-[-0.5px] text-on-sky">
        {titleKey ? t(titleKey) : t('studentRoutes.placeholder.eyebrow')}
      </h1>
      <p className="max-w-[420px] text-[15px] text-[color:var(--on-sky-text-body)]">{t('studentRoutes.placeholder.body')}</p>
      {entries.length > 0 && (
        <dl className="mt-2 grid gap-1 text-[13px] text-[color:var(--on-sky-text-body)]" data-testid="route-params">
          {entries.map(([name, value]) => (
            <div className="flex justify-center gap-2" key={name}>
              <dt className="font-mono">{name}</dt>
              <dd className="font-mono text-on-sky">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
