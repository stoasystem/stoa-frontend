import { Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function StopGeneratingButton({ onStop }: { onStop: () => void }) {
  const { t } = useTranslation('chat')
  return (
    <Button type="button" variant="outline" size="icon" aria-label={t('stopGenerating')} onClick={onStop}>
      <Square className="h-4 w-4" />
    </Button>
  )
}
