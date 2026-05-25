import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TeacherRequestInlineAction({
  onRequestTeacher,
  isRequesting,
  feedback,
}: {
  onRequestTeacher?: () => void
  isRequesting?: boolean
  feedback?: string | null
}) {
  return (
    <div className="mt-4 rounded-lg border border-border/70 bg-secondary/40 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <GraduationCap className="mt-0.5 h-4 w-4 text-[hsl(var(--accent))]" />
          <div>
            <div className="text-sm font-medium text-foreground">
              Need a teacher to explain this?
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Ask a human tutor from this conversation if the AI answer is still unclear.
            </p>
            {feedback && <p className="mt-2 text-xs text-[hsl(var(--accent))]">{feedback}</p>}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRequestTeacher}
          disabled={!onRequestTeacher || isRequesting}
        >
          {isRequesting ? 'Requesting...' : 'Ask a human tutor'}
        </Button>
      </div>
    </div>
  )
}
