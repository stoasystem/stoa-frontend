import { useTranslation } from 'react-i18next'

/**
 * The card had its three sentences written into it in English, so a family
 * reading the German dashboard got an English block in the middle of it.
 */
export function ParentValueCard({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  const { t } = useTranslation('parent')

  // A plain card on Ground (Tokens board: Surface, hairline border, no shadow).
  return (
    <section className="rounded-[16px] border border-[color:var(--card-border)] bg-surface px-6 py-5">
      <h2 className="m-0 text-ink" style={{ font: 'var(--t-headline)' }}>
        {title ?? t('valueCard.title')}
      </h2>
      <div className="mt-2 space-y-2 text-[15px] leading-[1.45] text-caption">
        {description ? (
          <p className="m-0">{description}</p>
        ) : (
          <>
            <p className="m-0">{t('valueCard.body1')}</p>
            <p className="m-0">{t('valueCard.body2')}</p>
          </>
        )}
      </div>
    </section>
  )
}
