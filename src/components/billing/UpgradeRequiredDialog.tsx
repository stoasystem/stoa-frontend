import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function UpgradeRequiredDialog({ children, reason }: { children: ReactNode; reason: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade required</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            asChild
            onClick={() => {
              trackEvent('upgrade_prompt_clicked', { reason })
            }}
          >
            <Link to="/pricing">Compare plans</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
