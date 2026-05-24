import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ParentReportRecommendation } from '@/types/parentReport'

export function ParentReportRecommendations({
  recommendations,
}: {
  recommendations: ParentReportRecommendation[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground">No recommendations are available yet.</p>
        )}
        {recommendations.map((recommendation) => (
          <div key={recommendation.id} className="space-y-2 rounded-md border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-medium">{recommendation.title}</h2>
              <Badge variant={recommendation.priority === 'high' ? 'destructive' : 'outline'}>
                {recommendation.priority}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{recommendation.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
