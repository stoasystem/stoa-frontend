import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/**
 * The canned follow-up prompts.
 *
 * These carried inline English fallbacks against keys that were never added to
 * any locale, so the chips — and the message sent when one was pressed — stayed
 * English in every language. The keys exist now, so the text is the translation.
 */
const SUGGESTIONS = [
  'followUp.explainStep',
  'followUp.simpler',
  'followUp.similar',
  'followUp.why',
] as const

export function FollowUpSuggestions({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation('chat')

  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label={t('followUp.label')}>
      {SUGGESTIONS.map((key) => {
        const label = t(key)
        return (
          <Button
            key={key}
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            className="h-auto rounded-full px-3 py-1 text-xs font-normal"
            onClick={() => onSelect(label)}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}
