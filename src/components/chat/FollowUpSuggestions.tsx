import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/**
 * i18n keys for the canned follow-up prompts. The English text in
 * `fallback` is used when the chat namespace has not been translated yet.
 */
const SUGGESTIONS = [
  { key: 'followUp.explainStep', fallback: "I don't understand one of the steps" },
  { key: 'followUp.simpler', fallback: 'Can you explain it more simply?' },
  { key: 'followUp.similar', fallback: 'Give me a similar exercise' },
  { key: 'followUp.why', fallback: 'Why does this work?' },
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
    <div className="mt-3 flex flex-wrap gap-2" aria-label={t('followUp.label', { defaultValue: 'Follow-up suggestions' })}>
      {SUGGESTIONS.map(({ key, fallback }) => {
        const label = t(key, { defaultValue: fallback })
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
