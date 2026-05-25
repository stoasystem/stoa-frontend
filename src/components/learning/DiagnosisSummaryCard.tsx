import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LearningDiagnosis } from '@/types/diagnosis'

export function DiagnosisSummaryCard({ diagnosis }: { diagnosis: LearningDiagnosis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Diagnosis summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{diagnosis.summary}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {diagnosis.weakPoints.map((weakPoint) => (
            <div key={weakPoint.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{weakPoint.topic}</p>
                  <p className="text-sm text-muted-foreground">{weakPoint.subject}</p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                  {weakPoint.severity}
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {weakPoint.evidence.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-3 text-sm font-medium">{weakPoint.recommendation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
