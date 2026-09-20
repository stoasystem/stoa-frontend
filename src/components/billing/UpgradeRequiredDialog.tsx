import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function UpgradeRequiredDialog({ children, reason }: { children: ReactNode; reason: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {/* Card 007: payments and billing are frozen. The dialog still
              explains why the feature is closed; the "Compare plans" link and
              its upgrade tracking event are withdrawn, because there is no
              billing page left to send anyone to. */}
          <DialogTitle>Not available on this account</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
