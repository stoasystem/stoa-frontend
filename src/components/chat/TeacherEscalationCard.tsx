import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function TeacherEscalationCard() {
  return (
    <div className="px-4 md:px-6">
      <Card className="mx-auto mb-4 max-w-3xl">
        <CardContent className="flex flex-col gap-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-md bg-secondary p-2 text-secondary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">Need help from a teacher?</div>
              <p className="mt-1 text-muted-foreground">
                Request human tutor support when the AI explanation is not clear enough.
              </p>
            </div>
          </div>
          <Button className="shrink-0" variant="outline" size="sm">
            Request teacher
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
