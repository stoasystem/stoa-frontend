import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ContinueLearningCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Continue learning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Your fastest path is to reopen the last chat, compare the AI answer with your class
          notes, then request teacher support if the explanation still feels unclear.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/chat">Open chat</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/learning-history">View history</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
