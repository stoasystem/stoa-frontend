const steps = [
  'Organization information',
  'Students and subjects',
  'Tutor or teacher team',
  'Pilot timing',
  'Contact details',
]

export function PartnershipSteps() {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step} className="rounded-md border bg-card p-3">
          <p className="text-sm font-medium">Step {index + 1}</p>
          <p className="mt-1 text-sm text-muted-foreground">{step}</p>
        </div>
      ))}
    </div>
  )
}
