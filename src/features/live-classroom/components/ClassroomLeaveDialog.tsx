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
  teacherMode = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  teacherMode?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{teacherMode ? 'End classroom for everyone?' : 'Leave classroom?'}</DialogTitle>
          <DialogDescription>
            {teacherMode
              ? 'This will close the session and generate the classroom summary.'
              : 'You can return while the classroom session is still active.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant={teacherMode ? 'destructive' : 'default'} onClick={onConfirm}>
            {teacherMode ? 'End Session' : 'Leave Classroom'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
