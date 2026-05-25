export function RetentionTable({
  cohorts,
}: {
  cohorts: { cohort: string; week1: number; week4: number; week8: number }[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b text-xs uppercase tracking-normal text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Cohort</th>
            <th className="py-2 pr-4 font-medium">Week 1</th>
            <th className="py-2 pr-4 font-medium">Week 4</th>
            <th className="py-2 pr-4 font-medium">Week 8</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {cohorts.map((cohort) => (
            <tr key={cohort.cohort}>
              <td className="py-3 pr-4 font-medium">{cohort.cohort}</td>
              <td className="py-3 pr-4">{cohort.week1}%</td>
              <td className="py-3 pr-4">{cohort.week4}%</td>
              <td className="py-3 pr-4">{cohort.week8 || 'n/a'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
