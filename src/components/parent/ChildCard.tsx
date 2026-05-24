import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ParentChild } from '@/types/parent'

export function ChildCard({ child }: { child: ParentChild }) {
  return (
    <Link to={`/parent/children/${child.id}`}>
      <Card className="h-full transition-colors hover:bg-secondary/40">
        <CardHeader>
          <CardTitle className="text-lg">{child.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{child.grade}</p>
          <p>{child.primarySubjects.join(', ')}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
