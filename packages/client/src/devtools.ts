import { Observable } from 'rxjs'

function getGlobal() {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof global !== 'undefined') { return global }
  throw new Error('unable to locate global object')
}

type ObservableDebugMeta = { __debug?: { id: string, name: string, groupName?: string, groupStart?: string, parent: unknown[] } }

const debugWindow = <{ __easyhardDebug?: boolean }>getGlobal()

export function debugSkipInternal<A, B>(name: string, start: Observable<A> & ObservableDebugMeta, end: Observable<B> & ObservableDebugMeta) {
  if (debugWindow.__easyhardDebug && end.__debug && start.__debug) {
    end.__debug = start.__debug
    end.__debug.name = name
  }
  return end
}


export function debugAddParent<A, B>(source: Observable<A> & ObservableDebugMeta, observable: Observable<B> & ObservableDebugMeta) {
  if (debugWindow.__easyhardDebug && source.__debug && observable.__debug) {
    observable.__debug.parent.push({ type: 'other', link: source })
  }
}
