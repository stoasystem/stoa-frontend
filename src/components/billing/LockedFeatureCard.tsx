import { Lock } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function LockedFeatureCard({ feature, reason }: { feature: string; reason: string }) {
  useEffect(() => {
    trackEvent('feature_locked_viewed', { feature, reason })
  }, [feature, reason])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4" />
          {feature}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>{reason}</p>
        <Button
          asChild
          variant="outline"
          onClick={() => {
            trackEvent('upgrade_prompt_clicked', { feature })
          }}
        >
          <Link to="/pricing">View plans</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
