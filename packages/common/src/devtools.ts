/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable, ReplaySubject, Subscription } from 'rxjs'
import { getUID } from '.'

function getGlobal() {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof global !== 'undefined') { return global }
  throw new Error('unable to locate global object')
}

type DebugProps = {
  id: string
  name: string
  parent: []
  nextBuffer: ReplaySubject<{ value: any, time: number }>
  subscribe: ReplaySubject<number>
  unsubscribe: ReplaySubject<number>
}

const debugWindow = <{ __easyhardDebug?: boolean }>getGlobal()

export function debugObservable(observable: Observable<any>, name: string) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(observable, '__debug', {
      value: <DebugProps>{
        id: getUID(),
        name,
        parent: [],
        nextBuffer: new ReplaySubject(),
        subscribe: new ReplaySubject(),
        unsubscribe: new ReplaySubject()
      },
      writable: false,
      configurable: false
    })
  }

  return observable
}

export function debugNext<T>(observable: Observable<any> & { __debug?: DebugProps }, value: T): T {
  if (debugWindow.__easyhardDebug) {
    observable.__debug?.nextBuffer.next({ value, time: Date.now() })
  }
  return value
}

export function debugSubscription(observable: Observable<any> & { __debug?: DebugProps }, subscription: Subscription, change: (k: number) => number) {
  if (debugWindow.__easyhardDebug) {
    subscription.add(() => observable.__debug?.unsubscribe.next(change(-1)))
    observable.__debug?.subscribe.next(change(+1))
  }
}
