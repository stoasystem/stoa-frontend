export type TopicStatus = 'weak' | 'developing' | 'stable' | 'strong'

export type CurriculumTopicNode = {
  id: string
  label: string
  subject: string
  status: TopicStatus
  x: number
  y: number
  detail: string
  recentQuestions: string[]
  recommendations: string[]
}

export type CurriculumTopicEdge = {
  id: string
  source: string
  target: string
  relation: 'prerequisite' | 'related'
}

export type CurriculumGraph = {
  nodes: CurriculumTopicNode[]
  edges: CurriculumTopicEdge[]
}
