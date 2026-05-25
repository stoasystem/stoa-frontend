import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { OrganizationStudent } from '@/types/organization'

export function OrganizationStudentTable({ students }: { students: OrganizationStudent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-normal text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Student</th>
                <th className="py-2 pr-4 font-medium">Grade</th>
                <th className="py-2 pr-4 font-medium">Subjects</th>
                <th className="py-2 pr-4 font-medium">Weak topics</th>
                <th className="py-2 pr-4 font-medium">Teacher help</th>
                <th className="py-2 pr-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="py-3 pr-4 font-medium">{student.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{student.grade}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{student.primarySubjects.join(', ')}</td>
                  <td className="py-3 pr-4">{student.weakTopicCount}</td>
                  <td className="py-3 pr-4">{student.teacherHelpCount}</td>
                  <td className="py-3 pr-4">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to={`/organization/students/${student.id}/learning-profile`}
                        onClick={() => trackEvent('organization_student_opened', { studentId: student.id })}
                      >
                        Open profile
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
