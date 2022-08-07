import { Observable, ReplaySubject, Subscriber, Subscription } from 'rxjs'
import { Connection, MessageEvent } from './binder'

function getGlobal() {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof global !== 'undefined') { return global }
  throw new Error('unable to locate global object')
}

const debugWindow = <{ __easyhardDebug?: boolean }>getGlobal()

export function debugBind(bridgeId: string, sub: EhSubscriber, client: Connection<any, any>, send: (data: any) => void) {
  if (debugWindow.__easyhardDebug) {
    if (!sub.__debug) return null
    const bridge = sub.__debug.bridge || (sub.__debug.bridge = new ReplaySubject())
    const bridgeIn = sub.__debug.bridgeIn || (sub.__debug.bridgeIn = new ReplaySubject())
    const onMessage = (event: MessageEvent<any>) => {
      if (bridgeId === event.data.bridgeId && event.data.debug) {
        bridge.next(event.data.debug)
      }
    }
    const bridgeInSub = bridgeIn.subscribe(arg => {
      send({ bridgeId, debug: arg })
    })

    client.addEventListener('message', onMessage)
    return {
      payload: { destinationId: sub.__debug.observable?.__debug.id },
      destroy: () => {
        setTimeout(() => { // wait until "unsubscribe" messages received
          client.removeEventListener('message', onMessage)
          bridgeInSub.unsubscribe()
        }, 500)
      }
    }
  }
}

type ReplayBufferSubscription = { unsubscribe: () => void }
type ReplayBuffer<T> = { next: (v: T) => void, subscribe: (v: (v: T) => void) => ReplayBufferSubscription, snapshot: any }

export type DebugObservable = Observable<any> & { __debug: { id: string, name: string }}
export type EhSubscriber = Subscriber<any> & {
  destination?: EhSubscriber
  __debug?: {
    id: string
    observable: null | DebugObservable
    nextBuffer: ReplayBuffer<Emission>
    sources: ReplayBuffer<any>
    bridge?: ReplaySubject<any>
    bridgeIn?: ReplaySubject<any>
  }
}
type Emission = { valueId: string, value: any, time: number }
type SubscriptionSet = { subs: ReplayBufferSubscription[], sources: Set<EhSubscriber> }

class SubscribersTracker {
  subs = new Map<EhSubscriber, SubscriptionSet>()

  constructor(private events: {
    added: (sub: EhSubscriber, props?: any) => void
    removed: (sub: EhSubscriber) => void
    next: (sub: EhSubscriber, v: Emission) => void
  }) {}

  add(subscriber: EhSubscriber, props?: any) {
    if (!subscriber.__debug) throw new Error('subscriber.__debug')
    if (this.subs.has(subscriber)) return

    const data: SubscriptionSet = { subs: [], sources: new Set() }
    this.subs.set(subscriber, data)
    this.events.added(subscriber, props)

    const { nextBuffer, sources } = subscriber.__debug

    data.subs.push(nextBuffer.subscribe(value => {
      this.events.next(subscriber, value)
    }))

    data.subs.push(sources.subscribe((s: { add: EhSubscriber } | { remove: EhSubscriber }) => {
      if ('add' in s) {
        this.add(s.add)
        data.sources.add(s.add)
      }
      if ('remove' in s) {
        this.remove(s.remove)
        data.sources.delete(s.remove)
      }
    }))
  }

  remove(subscriber: EhSubscriber) {
    const data = this.subs.get(subscriber)

    if (data) {
      data.subs.forEach((sub: any) => sub.unsubscribe())
      this.events.removed(subscriber)
      this.subs.delete(subscriber)
      data.sources.forEach(source => this.remove(source))
    }
  }
}

function sanitizeSubscriber(sub: EhSubscriber) {
  if (!sub.__debug) throw new Error('need __debug')
  const { destination, __debug: { id, sources, observable } } = sub

  return {
    destination: destination && destination.__debug && {
      __debug: {
        id,
        sourcesId: sources.snapshot().map((s: any) => s.__debug.id),
        observable: destination.__debug.observable ? {
          __debug: destination.__debug.observable.__debug
        } : null
      }
    },
    __debug: {
      id,
      sourcesId: sources.snapshot().map((s: any) => s.__debug.id),
      observable: observable ? {
        __debug: observable.__debug
      } : null
    }
  }
}
type ObservableEmissionType = 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | 'null' | 'undefined'
function stringify<T extends object>(value: T): { value: string, type: ObservableEmissionType } {
  const type = typeof value

  if (value === null || value === undefined) {
    return {
      value: String(value),
      type: value === null ? 'null' : 'undefined'
    }
  }

  if (type === 'function') {
    return {
      value: value.constructor.name,
      type: 'function'
    }
  }

  const valueString = value && value.toString()

  if (['string', 'number', 'boolean'].includes(type)) {
    return {
      value: valueString,
      type: type as 'string' | 'number' | 'boolean'
    }
  }

  if (Array.isArray(value)) {
    return {
      value: `[${valueString}]`,
      type: 'array'
    }
  }

  if (type === 'object') {
    return {
      value: value.constructor.name,
      type: 'object'
    }
  }

  return {
    value: valueString,
    type: 'object'
  }
}

const trackers = new Map<string, SubscribersTracker>()
const bridgeSubs = new Map<EhSubscriber, Subscription>()

export function debugAddSubscriber(id: string, observableId: string | undefined, sub: EhSubscriber | Subscription, connection: Connection<any, any>, send: (data: any) => void) {
  if (debugWindow.__easyhardDebug) {
    const destination = (sub as EhSubscriber).destination
    if (destination?.__debug && observableId) destination.__debug.observable = { // replace destination to connect end server node and start client node
      __debug: {
        id: observableId,
        name: 'Observable!!'
      }
    } as any

    connection.addEventListener('message', e => {
      if (e.data.bridgeId === id && e.data.debug) {
        if (e.data.debug.logEmission) {
          const valueId: string = e.data.debug.logEmission.valueId
          if (valuesCache.has(valueId)) {
            console.log('[Easyhard.js log emission]', valuesCache.get(valueId))
          }
        }
        if (e.data.debug.getEmissionValue) {
          const valueId: string = e.data.debug.getEmissionValue.valueId
          const { type, value } = stringify(valuesCache.get(valueId))

          send({ bridgeId: id, debug: { emissionValue: { type, value, valueId } }})
        }
      }
    })

    const valuesCache = new Map<string, any>()
    const tracker = new SubscribersTracker({
      added: (sub) => {
        send({ bridgeId: id, debug: {
          added: true,
          subscriber: sanitizeSubscriber(sub)
        }})
        if (sub.__debug?.bridge && sub.__debug.bridgeIn) {
          bridgeSubs.set(sub, sub.__debug.bridge.subscribe(v => {
            send({ bridgeId: id, debug: v })
          }))
        }
      },
      removed: (sub) => {
        send({ bridgeId: id, debug: {
          removed: true,
          subscriber: sanitizeSubscriber(sub)
        }})
        bridgeSubs.get(sub)?.unsubscribe()
      },
      next: (sub, { valueId, value, time }) => {
        valuesCache.set(valueId, value)
        send({ bridgeId: id, debug: {
          next: true,
          subscriber: sanitizeSubscriber(sub),
          value: { valueId, time }
        }})
      }
    })
    tracker.add(sub as EhSubscriber)
    trackers.set(id, tracker)
  }
}

export function debugRemoveSubscriber(id: string, sub: EhSubscriber | Subscription) {
  if (debugWindow.__easyhardDebug) {
    const tracker = trackers.get(id)

    if (tracker) {
      tracker.remove(sub as EhSubscriber)
      trackers.delete(id)
    }
  }
}
