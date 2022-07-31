import { Observable, OperatorFunction } from 'rxjs'

export type GraphNodeType = 'eh-text' | 'text' | 'node' | 'eh-node' | 'observable' | 'observable-group' | 'fragment'
export type GraphNode = {
  id: string
  type: GraphNodeType
  label: string | null
  group?: null | { name: string, start: string }
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

export type InpectorAction = { id: string }
export type InspectorPayload = InpectorAction | { active: boolean } | null
export type GraphPayload = { clear: true } | { added: Graph } | { removed: string[] } | { text: { id: string, value: string }}
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
