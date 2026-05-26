import { Lightbulb } from 'lucide-react'
import { PracticeTeacherSupportCTA } from '@/components/practice/PracticeTeacherSupportCTA'
import { PracticeToChatCTA } from '@/components/practice/PracticeToChatCTA'
import type { PracticeHintResponse } from '@/types/practice'

export function HintPanel({
  hint,
  onExplain,
  onTeacherHelp,
  teacherHelpVisible,
  teacherHelpMessage,
}: {
  hint: PracticeHintResponse | undefined
  onExplain: () => void
  onTeacherHelp: () => void
  teacherHelpVisible?: boolean
  teacherHelpMessage?: string
}) {
  if (!hint) return null

  return (
    <div className="rounded-lg border border-primary/15 bg-[hsl(var(--stoa-brand-burgundy-soft)_/_0.55)] p-4">
      <div className="flex gap-3">
        <Lightbulb className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold">{hint.title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{hint.hint}</p>
          <p className="rounded-md border bg-card/80 px-3 py-2 text-sm leading-6">{hint.nextStep}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <PracticeToChatCTA onExplain={onExplain} />
            {teacherHelpVisible && (
              <PracticeTeacherSupportCTA onTeacherHelp={onTeacherHelp} />
            )}
          </div>
          {teacherHelpMessage && <p className="text-sm text-muted-foreground">{teacherHelpMessage}</p>}
        </div>
      </div>
    </div>
  )
}
