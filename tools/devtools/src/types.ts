import { TuplifyUnion } from './utils/types'

export type GraphNode = {
  id: string
  type: 'eh-text' | 'text' | 'node' | 'eh-node' | 'observable' | 'fragment'
  label: string | null
}
export type EdgeType = 'argument' | 'other'
export type GraphEdge = { id: string, source: string, target: string, type: EdgeType, label?: string }
export type Graph = { nodes: GraphNode[], edges: GraphEdge[] }

export type ObservableEmission = { id: string, time: number, valueId: string }
export type ObservableEmissionType = 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | 'null' | 'undefined'


export type Services = {
  'easyhard-devtools': { type: 'GRAPH', data: Graph }
  | { type: 'ADDED', data: Graph }
  | { type: 'REMOVED', data: string[] }
  | { type: 'TEXT', data: { id: string, text: string }}
  | { type: 'NEXT', data: ObservableEmission }
  | { type: 'SUBSCRIBE', data: { id: string, count: number } }
  | { type: 'UNSUBSCRIBE', data: { id: string, count: number } }
  | { type: 'FOCUS', data: { id: string }}
  | { type: 'EMISSION_VALUE', data: {
    id: string,
    valueId: string,
    value: object | string | number | boolean,
    type: ObservableEmissionType,
    source: 'tooltip' | 'marbles'
  }}
  | { type: 'STOP_INSPECTING' }
  'easyhard-content':  { type: 'GET_GRAPH' }
  | { type: 'INSPECT', data: null | { id: string }}
  | { type: 'INSPECTING', data: { action: 'start' } | { action: 'stop' } }
  | { type: 'LOG_EMISSION', data: { valueId: string } }
  | { type: 'GET_EMISSION_VALUE', data: { id: string, valueId: string, source: 'tooltip' | 'marbles' } }
}

export type ServicesTypes<T extends keyof Services> = TuplifyUnion<Services[T]['type']>
