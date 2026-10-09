import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrganizationTeacher } from '@/types/organization'

export function OrganizationTeacherTable({ teachers }: { teachers: OrganizationTeacher[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Teachers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-normal text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Teacher</th>
                <th className="py-2 pr-4 font-medium">Subjects</th>
                <th className="py-2 pr-4 font-medium">Availability</th>
                <th className="py-2 pr-4 font-medium">Pending</th>
                <th className="py-2 pr-4 font-medium">Resolved</th>
                <th className="py-2 pr-4 font-medium">Avg response</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="py-3 pr-4 font-medium">{teacher.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{teacher.subjects.join(', ')}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{teacher.availability}</td>
                  <td className="py-3 pr-4">{teacher.pendingRequests}</td>
                  <td className="py-3 pr-4">{teacher.resolvedRequests}</td>
                  <td className="py-3 pr-4">{teacher.averageResponseTimeMinutes ?? 0} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
