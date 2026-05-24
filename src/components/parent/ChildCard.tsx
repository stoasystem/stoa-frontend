import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ParentChild } from '@/types/parent'

export function ChildCard({ child }: { child: ParentChild }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">
          <Link className="transition-colors hover:text-primary" to={`/parent/children/${child.id}`}>
            {child.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="space-y-2">
          <p>{child.grade}</p>
          <p>{child.primarySubjects.join(', ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/parent/children/${child.id}`}>Summary</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/parent/children/${child.id}/report`}>Weekly report</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
