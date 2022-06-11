/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from 'rxjs'
import { getUID } from '.'

const debugWindow = <Window & { __easyhardDebug?: boolean }>window

export function debugObservable(observable: Observable<any>, name: string) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(observable, '__debug', {
      value: {
        id: getUID(),
        name,
        parent: []
      },
      writable: false,
      configurable: false
    })
  }

  return observable
}
