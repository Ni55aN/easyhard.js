import { Attrs, TagName } from 'easyhard'
import { Observable, ReplaySubject, Subscriber } from 'rxjs'
import { EdgeType } from './types'

export type Parent = { type: EdgeType, link: EhSubscriber | EhNode }
export type NestedParent = Parent | NestedParent[]
export type BridgeChanges = { id: string, name: string, parents: { type: EdgeType, id: string }[], isEntry?: boolean }
| { id: string, valueId: string, time: number }
| { id: string, subscribe: true, count: number }
| { id: string, unsubscribe: true, count: number }

// eslint-disable-next-line @typescript-eslint/ban-types
export type EhObservable = Observable<unknown> & {
  __debug: {
    id: string
    parent: NestedParent[]
    name: string,
    nextBuffer: ReplaySubject<{ value: any, time: number }>
    subscribe: ReplaySubject<number>
    unsubscribe: ReplaySubject<number>
    groupName?: string
    groupStart?: string
    bridge?: ReplaySubject<BridgeChanges>
  }
}
export type EhSubscriber = Subscriber<any> & {
  destination?: EhSubscriber
  __debug?: {
    id: string
    observable: null | DebugObservable
    nextBuffer: ReplayBuffer
    sources: ReplayBuffer,
    bridge?: ReplaySubject<any>
  }
}
export type EhMeta = {
  __easyhard?: { id: string, label?: string, attrs?: Attrs<TagName>, indirect?: boolean, type?: 'fragment', static?: boolean, parent?: NestedParent[] },
  __easyhardIgnore?: true
}
export type EhNode = Node & EhMeta

export type ReplayBufferSubscription = { unsubscribe: () => void }
export type ReplayBuffer = { next: any, subscribe: (v: any) => ReplayBufferSubscription, snapshot: any }
export type DebugObservable = Observable<any> & { __debug: { id: string, name: string, scope?: string }}
