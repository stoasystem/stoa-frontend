import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChildStarAnswers } from '@/types/parent'

/**
 * Per star, the exercises the child answered right on their own and those
 * answered right after asking AI about them first (stoa-backend#449). Both
 * light the star alike; this only lets the parent see the difference.
 *
 * `starAnswers` is undefined from a backend before stoa-backend#460: then the
 * card is not drawn at all, rather than claiming nothing was answered right.
 */
export function ChildStarAnswersCard({ starAnswers }: { starAnswers: ChildStarAnswers[] | undefined }) {
  const { t } = useTranslation('parent')
  if (!Array.isArray(starAnswers)) return null

  return (
    <Card data-child-star-answers>
      <CardHeader>
        <CardTitle className="text-lg">{t('summary.starAnswers')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('summary.starAnswersDescription')}</p>
      </CardHeader>
      <CardContent>
        {starAnswers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('summary.starAnswersNone')}</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {starAnswers.map((star) => (
              <li
                key={star.unitId}
                className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <p className="m-0 min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{star.title || star.unitId}</p>
                <p className="m-0 flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{t('summary.starAnswersIndependent', { count: star.independent })}</span>
                  <span>{t('summary.starAnswersAskedAi', { count: star.askedAi })}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
