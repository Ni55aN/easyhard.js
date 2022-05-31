

export type GraphNode = {
  id: string
  type: 'eh-text' | 'text' | 'node' | 'eh-node' | 'observable'
  label: string | null
}
export type GraphEdge = { id: string, source: string, target: string }
export type Graph = { nodes: GraphNode[], edges: GraphEdge[] }

export type Services = {
  'easyhard-devtools': { type: 'GRAPH', data: Graph }
  'easyhard-content':  { type: 'GET_GRAPH' }
}
