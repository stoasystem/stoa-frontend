import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BackButtonProps = {
  to?: string
  label?: string
}

export function BackButton({ to, label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate()

  if (to) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to={to}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {label}
        </Link>
      </Button>
    )
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      {label}
    </Button>
  )
}
