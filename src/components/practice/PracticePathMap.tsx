import { LearningUnitCard } from '@/components/practice/LearningUnitCard'
import type { LearningUnit } from '@/types/practice'

export function PracticePathMap({ units }: { units: LearningUnit[] }) {
  return (
    <div className="space-y-10">
      {units.map((unit) => (
        <LearningUnitCard key={unit.id} unit={unit} />
      ))}
    </div>
  )
}
