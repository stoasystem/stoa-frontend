import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrganizationTutor } from '@/types/organization'

export function OrganizationTutorTable({ tutors }: { tutors: OrganizationTutor[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Tutors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-normal text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Tutor</th>
                <th className="py-2 pr-4 font-medium">Subjects</th>
                <th className="py-2 pr-4 font-medium">Availability</th>
                <th className="py-2 pr-4 font-medium">Pending</th>
                <th className="py-2 pr-4 font-medium">Resolved</th>
                <th className="py-2 pr-4 font-medium">Avg response</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tutors.map((tutor) => (
                <tr key={tutor.id}>
                  <td className="py-3 pr-4 font-medium">{tutor.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{tutor.subjects.join(', ')}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{tutor.availability}</td>
                  <td className="py-3 pr-4">{tutor.pendingRequests}</td>
                  <td className="py-3 pr-4">{tutor.resolvedRequests}</td>
                  <td className="py-3 pr-4">{tutor.averageResponseTimeMinutes ?? 0} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
