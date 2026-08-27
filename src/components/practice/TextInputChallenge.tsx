import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TextInputChallenge({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation('practice')
  return (
    <div className="space-y-2">
      <Label htmlFor="practice-answer">Your answer</Label>
      <Input
        disabled={disabled}
        id="practice-answer"
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('path.writeAnswer')}
        value={value}
      />
    </div>
  )
}
