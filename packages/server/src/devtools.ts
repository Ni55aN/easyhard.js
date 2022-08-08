import { Observable, OperatorFunction } from 'rxjs'

function getGlobal() {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof global !== 'undefined') { return global }
  throw new Error('unable to locate global object')
}

type ObservableDebugMeta = { __debug?: { id: string, name: string, groupName?: string, groupStart?: string, parent: unknown[] } }

const debugWindow = <{ __easyhardDebug?: boolean }>getGlobal()

export function debugSkipInternal<A, B>(name: string | null, start: Observable<A> & ObservableDebugMeta, end: Observable<B> & ObservableDebugMeta) {
  if (debugWindow.__easyhardDebug && end.__debug && start.__debug) {
    end.__debug = start.__debug
    if (name) end.__debug.name = name
  }
  return end
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
