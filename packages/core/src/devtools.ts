import { getUID } from 'easyhard-common'
import { Observable, OperatorFunction } from 'rxjs'
import { Anchor, Attrs, TagName } from './types'

const debugWindow = <Window & { __easyhardDebug?: boolean }>window

export function debugElement(element: HTMLElement, attrs: Attrs<TagName>) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(element, '__easyhard', {
      value: {
        id: getUID(),
        attrs
      },
      writable: false,
      configurable: false
    })
  }
}

export function debugAnchor(anchor: Anchor, observable: Observable<unknown>) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(anchor, '__easyhard', {
      value: {
        id: getUID(),
        observable
      },
      writable: false,
      configurable: false
    })
  }
}

export function debugOperator<T, K>(operator: OperatorFunction<T, K>, name: string, parent: (Node | Observable<never>)[]): OperatorFunction<T, K> {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(operator, '__debug', {
      value: {
        id: getUID(),
        name,
        parent
      },
      writable: false,
      configurable: false
    })
  }

  return operator
}
