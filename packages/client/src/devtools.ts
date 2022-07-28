import { Observable } from 'rxjs'

type ObservableDebugMeta = { __debug?: { id: string, groupName?: string, groupStart?: string, parent: unknown[] } }

const debugWindow = <Window & { __easyhardDebug?: boolean }>window


export function debugObservableGroup<A, B>(name: string, start: Observable<A> & ObservableDebugMeta, end: Observable<B> & ObservableDebugMeta) {
  if (debugWindow.__easyhardDebug && end.__debug && start.__debug) {
    end.__debug.groupStart = start.__debug.id
    end.__debug.groupName = name
  }
  return end
}


export function debugAddParent<A, B>(source: Observable<A> & ObservableDebugMeta, observable: Observable<B> & ObservableDebugMeta) {
  if (debugWindow.__easyhardDebug && source.__debug && observable.__debug) {
    observable.__debug.parent.push({ type: 'other', link: source })
  }
}
