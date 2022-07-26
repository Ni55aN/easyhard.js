import { Observable, OperatorFunction } from 'rxjs'

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


export type EmissionValueRequest = { id: string, valueId: string, source: 'tooltip' | 'marbles' }
export type EmissionValue = {
  id: string,
  valueId: string,
  value: object | string | number | boolean,
  type: ObservableEmissionType,
  source: 'tooltip' | 'marbles'
}

export type Services = 'easyhard-devtools' | 'easyhard-content'

export type InspectorPayload = { id: string } | { active: boolean } | null
export type GraphPayload = { graph: Graph } | { added: Graph } | { removed: string[] } | { text: { id: string, value: string }}
export type SubsPayload = { subscribe: { id: string, count: number }} | { unsubscribe: { id: string, count: number }}
export type ServicesScheme = {
  graph: OperatorFunction<GraphPayload, unknown>
  subscriptions: OperatorFunction<SubsPayload, unknown>
  emission: OperatorFunction<{ next: ObservableEmission }, unknown>
  requestEmissionValue: Observable<EmissionValueRequest>
  emissionValue: OperatorFunction<EmissionValue, unknown>
  logEmission: Observable<{ valueId: string }>
  focus: OperatorFunction<{ id: string }, unknown>
  inspector: OperatorFunction<boolean, InspectorPayload>
}

export type ConnectionTunnelKey = 'connectionTunnel'
