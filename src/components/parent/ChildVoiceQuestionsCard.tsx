import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Toggle } from '@/components/base/Toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChildVoiceQuestionsQuery, useSetChildVoiceQuestionsMutation } from '@/hooks/parent/useChildVoiceQuestions'

/*
 * The parent's consent to voice questions (#697, stoa-backend#469): one switch
 * per child, off by default. Beside it, what happens to a recording once it is
 * on, in the same words as the privacy notice (ADR-010): turned into text in
 * Ireland by Voxtral, with nothing of the child sent along, kept nowhere. Any
 * linked parent may change it and the last change wins, so the card says who
 * changed it last.
 *
 * The switch shows what the server holds: while a change is on its way it is
 * held, and a change that fails leaves it where it was, with the reason.
 *
 * Solid `bg-card` (--surface), the background the contrast gate rates the off
 * toggle against.
 */
export function ChildVoiceQuestionsCard({ childId, childName }: { childId: string; childName: string }) {
  const { t, i18n } = useTranslation('parent')
  const query = useChildVoiceQuestionsQuery(childId)
  const update = useSetChildVoiceQuestionsMutation(childId)
  const titleId = `child-voice-questions-${childId}`
  const setting = query.data
  const changed = setting?.changedAt ? new Date(setting.changedAt) : null
  const changedOn = changed && !Number.isNaN(changed.getTime())
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, { dateStyle: 'long' }).format(changed)
    : null

  return (
    <Card data-child-voice-questions className="border-border/70 bg-card shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-lg">{t('voiceQuestions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && <p role="status" className="text-sm text-muted-foreground">{t('voiceQuestions.loading')}</p>}
        {query.isError && <p role="alert" className="text-sm text-destructive">{t('voiceQuestions.loadFailed')}</p>}
        {setting && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p id={titleId} className="text-sm font-semibold text-foreground">
                  {t('voiceQuestions.label')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('voiceQuestions.description', { name: childName })}
                </p>
              </div>
              <Toggle
                checked={setting.allowed}
                aria-labelledby={titleId}
                aria-describedby={`${titleId}-processing`}
                disabled={update.isPending}
                onCheckedChange={(next) => update.mutate(next)}
                data-child-voice-questions-switch
              />
            </div>
            <p id={`${titleId}-processing`} className="text-sm leading-6 text-muted-foreground">
              {t('voiceQuestions.processing')}
            </p>
            <p className="text-sm text-muted-foreground">{t('voiceQuestions.off')}</p>
            {changedOn && setting.changedByMe != null && (
              <p data-child-voice-questions-changed className="text-xs text-muted-foreground">
                {t(setting.changedByMe ? 'voiceQuestions.changedByMe' : 'voiceQuestions.changedByOther', { date: changedOn })}
              </p>
            )}
            <p className="text-sm">
              <Link to="/privacy" className="text-primary underline underline-offset-2">
                {t('voiceQuestions.privacyLink')}
              </Link>
            </p>
          </>
        )}
        <p role="status" className="text-sm text-muted-foreground empty:hidden">
          {update.isPending ? t('voiceQuestions.saving') : ''}
        </p>
        {update.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t('voiceQuestions.saveFailed')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
