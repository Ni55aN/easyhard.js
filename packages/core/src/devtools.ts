/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common'
import { Observable, OperatorFunction } from 'rxjs'
import { Attrs, DomElement, TagName } from './types'

const debugWindow = <Window & { __easyhardDebug?: boolean }>window

export function debugElement(element: Comment | HTMLElement | Text, attrs: Attrs<TagName>) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(element, '__easyhard', {
      value: {
        id: getUID(),
        attrs,
        parent: []
      },
      writable: false,
      configurable: false
    })
  }

  return element
}

export function debugFragment(anchor: DomElement, observable?: Observable<unknown>) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(anchor, '__easyhard', {
      value: {
        id: getUID(),
        observable,
        parent: observable ? [observable] : [],
        type: 'fragment'
      },
      writable: false,
      configurable: false
    })
  }
}

export function debugFragmentAddParent(anchor: DomElement & { __easyhard?: any }, parent: any) {
  if (debugWindow.__easyhardDebug) {
    anchor.__easyhard.parent.push(parent)
  }
}

export function debugFragmentChild(element: DomElement, parent: DomElement) {
  type T = { __easyhard?: any }
  if (debugWindow.__easyhardDebug) {
    if (element === null) return
    if (!(element as T).__easyhard) debugElement(element, {})
    ;(element as T).__easyhard.parent.push(parent)
    ;(element as T).__easyhard.indirect = true
  }
}

export function debugOperator<T, K, R extends OperatorFunction<T, K> | Observable<T>>(operator: R, name: string, parent: (Node | Observable<any>)[]): R {
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
