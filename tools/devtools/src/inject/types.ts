import { Attrs, TagName } from 'easyhard'
import { Observable, ReplaySubject } from 'rxjs'
import { EdgeType } from '../types'

export type Parent = { type: EdgeType, link: EhObservable | EhMeta }
export type NestedParent = Parent | NestedParent[]

// eslint-disable-next-line @typescript-eslint/ban-types
export type EhObservable = Observable<unknown> & { __debug: { id: string, parent: NestedParent[], name: string, nextBuffer: ReplaySubject<{ value: any, time: number }> } }
export type EhMeta = {
  __easyhard?: { id: string, label?: string, attrs?: Attrs<TagName>, indirect?: boolean, type?: 'fragment', static?: boolean, parent?: NestedParent[] },
  __easyhardIgnore?: true
}
export type EhNode = Node & EhMeta
