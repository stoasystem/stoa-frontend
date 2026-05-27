import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ManageBillingButton() {
  return (
    <Button asChild variant="outline" className="gap-2">
      <Link to="/billing/payment-settings">
        <Settings className="h-4 w-4" />
        Payment settings
      </Link>
    </Button>
  )
}
