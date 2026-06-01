import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ClassroomLeaveDialog({
  open,
  tutorMode = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  tutorMode?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tutorMode ? 'End classroom for everyone?' : 'Leave classroom?'}</DialogTitle>
          <DialogDescription>
            {tutorMode
              ? 'This will close the session and generate the classroom summary.'
              : 'You can return while the classroom session is still active.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant={tutorMode ? 'destructive' : 'default'} onClick={onConfirm}>
            {tutorMode ? 'End Session' : 'Leave Classroom'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
