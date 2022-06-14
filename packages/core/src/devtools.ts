/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common'
import { Observable, OperatorFunction } from 'rxjs'
import { Attrs, DomElement, TagName } from './types'

type ObservableDebugMeta = { __debug?: { fragment?: string } }
type Parent = Observable<any> | DomElement
type ElementDebugMeta = { __easyhard?: { id: string, attrs: Attrs<TagName>, parent: Parent[], indirect?: boolean } }
type FragmentDebugMeta = { __easyhard?: { id: string, observable: Observable<any>, label: string, parent: Parent[], type: string } }

const debugWindow = <Window & { __easyhardDebug?: boolean }>window

export function debugElement(element: Comment | HTMLElement | Text, attrs: Attrs<TagName>) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(element, '__easyhard', {
      value: <ElementDebugMeta['__easyhard']>{
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

export function debugFragment(anchor: DomElement, label: string, observable?: Observable<unknown> & ObservableDebugMeta) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(anchor, '__easyhard', {
      value: {
        id: getUID(),
        observable, // TODO unused
        parent: observable ? [observable] : [],
        label: label || observable?.__debug?.fragment || '',
        type: 'fragment'
      },
      writable: false,
      configurable: false
    })
  }
}

export function debugFragmentLabel(anchor: DomElement & FragmentDebugMeta, label: string) {
  if (debugWindow.__easyhardDebug) {
    if (!anchor.__easyhard) throw new Error('anchor should have __debug propery')
    anchor.__easyhard.label = label
  }
}
export function debugFragmentAddParent(anchor: DomElement & FragmentDebugMeta, parent: Observable<any> | DomElement) {
  if (debugWindow.__easyhardDebug) {
    if (!anchor.__easyhard) throw new Error('anchor should have __debug propery')
    anchor.__easyhard.parent.push(parent)
  }
}

export function debugFragmentChild(element: DomElement & (null | ElementDebugMeta), parent: DomElement) {
  if (debugWindow.__easyhardDebug) {
    if (element === null) return
    if (!element.__easyhard) debugElement(element, {})
    if (!element.__easyhard) throw new Error('element should have __debug propery')
    element.__easyhard.parent.push(parent)
    element.__easyhard.indirect = true
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

export function debugFragmentOperator<T>(name: string) {
  if (debugWindow.__easyhardDebug) {
    return (source: Observable<T> &  ObservableDebugMeta) => {
      if (!source.__debug) throw new Error('source should have __debug propery')
      source.__debug.fragment = name

      return source
    }
  }
  return (source: Observable<T>) => source
}
