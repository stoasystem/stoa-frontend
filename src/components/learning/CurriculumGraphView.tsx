import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import type { CurriculumGraph, CurriculumTopicNode } from '@/types/curriculumGraph'

const statusClassNames: Record<CurriculumTopicNode['status'], string> = {
  weak: 'border-destructive bg-destructive/10 text-destructive',
  developing: 'border-amber-500 bg-amber-50 text-amber-900',
  stable: 'border-blue-500 bg-blue-50 text-blue-950',
  strong: 'border-emerald-500 bg-emerald-50 text-emerald-950',
}

type CurriculumGraphViewProps = {
  graph: CurriculumGraph
  selectedTopicId?: string
  onSelectTopic: (topic: CurriculumTopicNode) => void
}

export function CurriculumGraphView({
  graph,
  selectedTopicId,
  onSelectTopic,
}: CurriculumGraphViewProps) {
  return (
    <div className="relative min-h-[360px] overflow-x-auto rounded-lg border bg-card p-4">
      <div className="relative h-[320px] min-w-[720px]">
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          {graph.edges.map((edge) => {
            const source = graph.nodes.find((node) => node.id === edge.source)
            const target = graph.nodes.find((node) => node.id === edge.target)
            if (!source || !target) return null

            return (
              <line
                key={edge.id}
                x1={`${source.x}%`}
                y1={`${source.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="currentColor"
                strokeDasharray={edge.relation === 'related' ? '4 4' : undefined}
                className="text-border"
                strokeWidth="2"
              />
            )
          })}
        </svg>
        {graph.nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={`absolute w-40 rounded-md border p-3 text-left text-sm shadow-sm transition hover:shadow ${statusClassNames[node.status]} ${
              selectedTopicId === node.id ? 'ring-2 ring-ring' : ''
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => onSelectTopic(node)}
          >
            <span className="block font-medium">{node.label}</span>
            <span className="mt-1 block text-xs"><SafeStatusLabel kind="learningTopic" value={node.status} /></span>
          </button>
        ))}
      </div>
    </div>
  )
}
