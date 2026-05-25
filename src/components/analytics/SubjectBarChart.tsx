export function SubjectBarChart({ data }: { data: { subject: string; count: number }[] }) {
  const max = Math.max(...data.map((item) => item.count), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.subject} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.subject}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
