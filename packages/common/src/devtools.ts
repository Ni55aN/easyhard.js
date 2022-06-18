/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from 'rxjs'
import { getUID } from '.'

function getGlobal() {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof global !== 'undefined') { return global }
  throw new Error('unable to locate global object')
}

const debugWindow = <{ __easyhardDebug?: boolean }>getGlobal()

export function debugObservable(observable: Observable<any>, name: string) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(observable, '__debug', {
      value: {
        id: getUID(),
        name,
        parent: [],
        onNext: []
      },
      writable: false,
      configurable: false
    })
  }

  return observable
}
