/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common'
import { Observable, ReplaySubject, Subscriber } from 'rxjs'
import { Connection, MessageEvent } from './binder'

function getGlobal() {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof global !== 'undefined') { return global }
  throw new Error('unable to locate global object')
}

type Parent = { type: 'argument' | 'other', link: EhObservable<any> }
type NestedParent = Parent | NestedParent[]
type Meta = { __debug?: {
  id: string
  name: string
  parent: NestedParent[]
  nextBuffer: ReplaySubject<{ value: any, time: number }>
  subscribe: ReplaySubject<number>
  unsubscribe: ReplaySubject<number>
  bridge: ReplaySubject<any>
} }
type EhObservable<T> = Observable<T> & Meta

const debugWindow = <{ __easyhardDebug?: boolean }>getGlobal()
const subs = new Map<string, Subscriber<any>>()
const values = new Map<string, any>()

async function listenObservable(observable: EhObservable<any>, send: (data: any) => void, bridgeId: string, isEntry?: boolean) {
  if (!observable.__debug) return
  const { id, name, nextBuffer, subscribe, unsubscribe } = observable.__debug
  const sub = new Subscriber<any>()

  await new Promise(res => setTimeout(res, 10)) // HOTFIX wait until all parents added (from mergeMap, etc)
  const parents = observable.__debug.parent.flat() as Parent[]

  send({
    debug: {
      id,
      name,
      parents: parents
        .filter(p => Boolean(p.link.__debug))
        .map(p => ({ type: p.type, id: p.link.__debug?.id })),
      isEntry
    },
    bridgeId
  })

  sub.add(nextBuffer.subscribe(({ value, time }) => {
    const valueId = getUID()

    values.set(valueId, value)
    send({ debug: { id, valueId, time }, bridgeId })
  }))
  sub.add(subscribe.subscribe(count => {
    send({ debug: { id, subscribe: true, count }, bridgeId })
  }))
  sub.add(unsubscribe.subscribe(count => {
    send({ debug: { id, unsubscribe: true, count }, bridgeId })
  }))

  parents.forEach(async item => {
    sub.add(await listenObservable(item.link, send, bridgeId))
  })

  return sub
}

export async function debugListenObservable(id: string, observable: EhObservable<any>, send: (data: any) => void) {
  if (debugWindow.__easyhardDebug) {
    if (subs.has(id)) return
    const sub = await listenObservable(observable, send, id, true)

    if (sub) {
      subs.set(id, sub)
    }
  }
}

export function debugCompleteSub(id: string) {
  const sub = subs.get(id)

  if (sub) {
    sub.unsubscribe()
    subs.delete(id)
  }
}

export function debugBindInit(observable: EhObservable<any>) {
  if (debugWindow.__easyhardDebug && observable.__debug && 'debug') {
    observable.__debug.bridge = new ReplaySubject()
  }
  return observable
}

export function debugBind(bridgeId: string, observable: EhObservable<any>, client: Connection<any, any>) {
  if (debugWindow.__easyhardDebug) {
    const onMessage = (event: MessageEvent<any>) => {
      if (bridgeId === event.data.bridgeId) {
        observable.__debug && observable.__debug.bridge.next(event.data.debug)
      }
    }
    client.addEventListener('message', onMessage)
    return () => {
      setTimeout(() => { // wait until "unsubscribe" messages received
        client.removeEventListener('message', onMessage)
      }, 500)
    }
  }
}
