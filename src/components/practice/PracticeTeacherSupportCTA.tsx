import { UserRoundCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PracticeTeacherSupportCTA({
  onTeacherHelp,
}: {
  onTeacherHelp: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card/70 p-3">
      <p className="text-sm font-medium">This step may need a clearer explanation.</p>
      <p className="text-xs leading-5 text-muted-foreground">
        Ask a tutor after trying the hint and a step-by-step explanation.
      </p>
      <Button onClick={onTeacherHelp} type="button" variant="secondary">
        <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
        Ask a Tutor
      </Button>
    </div>
  )
}
