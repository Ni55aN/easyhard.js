import { Observable, OperatorFunction, Subscriber, Subscription } from 'rxjs'

function getGlobal() {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof global !== 'undefined') { return global }
  throw new Error('unable to locate global object')
}

const debugWindow = <{ __easyhardDebug?: boolean }>getGlobal()

export function debugBindSubscribers(source: (Subscription | Subscriber<any>) & { destination?: any }, next: Subscriber<any> & { __debug?: any }) {
  if (debugWindow.__easyhardDebug) {
    source.destination = next
    next.__debug.sources.next({ add: source })
  }
}

export function debugObservableInternal<T extends Observable<any>>(ob: T): T {
  if (debugWindow.__easyhardDebug) {
    (ob as any).__debug.internal = true
  }
  return ob
}

export function debugOperatorInternal<T extends OperatorFunction<any, any>>(op: T): T {
  if (debugWindow.__easyhardDebug) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return ((...args) => debugObservableInternal(op(...args))) as T
  }
  return op
}
