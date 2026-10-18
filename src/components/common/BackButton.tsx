import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type BackButtonProps = {
  to?: string
  label?: string
}

export function BackButton({ to, label }: BackButtonProps) {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  // The default is said in the reader's language, not in English (#276).
  const text = label ?? t('actions.back')

  if (to) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to={to}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {text}
        </Link>
      </Button>
    )
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      {text}
    </Button>
  )
}
