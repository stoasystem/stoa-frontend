export function FunnelChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((item) => item.count), 1)

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="rounded-md border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span>{item.count}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
