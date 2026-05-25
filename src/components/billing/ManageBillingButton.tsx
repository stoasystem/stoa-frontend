import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ManageBillingButton() {
  return (
    <Button type="button" variant="outline" disabled className="gap-2">
      <Settings className="h-4 w-4" />
      Manage billing
    </Button>
  )
}
