

export type GraphNode = {
  id: string
  type: 'eh-text' | 'text' | 'node' | 'eh-node' | 'observable' | 'fragment'
  label: string | null
}
export type EdgeType = 'argument' | 'other'
export type GraphEdge = { id: string, source: string, target: string, type: EdgeType, label?: string }
export type Graph = { nodes: GraphNode[], edges: GraphEdge[] }

export type Services = {
  'easyhard-devtools': { type: 'GRAPH', data: Graph }
  | { type: 'ADDED', data: Graph }
  | { type: 'REMOVED', data: string[] }
  | { type: 'TEXT', data: { id: string, text: string }}
  'easyhard-content':  { type: 'GET_GRAPH' }
}
