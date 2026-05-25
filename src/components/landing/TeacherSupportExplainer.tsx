import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TeacherSupportExplainer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher support when confidence matters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
        <p>Students can escalate confusing answers instead of getting stuck after an AI response.</p>
        <p>Tutors see the student question, grade, subject, AI context, and recent follow-up.</p>
        <p>Parents can see that teacher support happened without exposing unnecessary private detail.</p>
      </CardContent>
    </Card>
  )
}
