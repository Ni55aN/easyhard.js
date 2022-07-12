/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common'
import { Observable, OperatorFunction, ReplaySubject } from 'rxjs'
import { DomElement } from './types'

type ObservableDebugMeta = { __debug?: { fragment?: string } }
type Parent = { type: 'argument' | 'other', link: Observable<any> | DomElement } | Parent[]
type ElementDebugMeta = { __easyhard?: { id: string, attrs: Record<string, Observable<any>>, parent: Parent[], indirect?: boolean } }
type FragmentDebugMeta = { __easyhard?: { id: string, label: string, parent: Parent[], type: string } }

const debugWindow = <Window & { __easyhardDebug?: boolean }>window

export function debugElement(element: Comment | HTMLElement | Text) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(element, '__easyhard', {
      value: <ElementDebugMeta['__easyhard']>{
        id: getUID(),
        attrs: {},
        parent: []
      },
      writable: false,
      configurable: false
    })
  }

  return element
}

export function debugElementAttr(element: (Comment | HTMLElement | Text) & ElementDebugMeta, name: string, ob: Observable<any>) {
  if (debugWindow.__easyhardDebug) {
    if (!element.__easyhard) throw new Error('element should have __debug property')
    element.__easyhard.attrs[name] = ob
  }
}

export function debugFragment(anchor: DomElement, label: string, parent?: Observable<unknown> & ObservableDebugMeta) {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(anchor, '__easyhard', {
      value: <FragmentDebugMeta['__easyhard']>{
        id: getUID(),
        parent: parent ? [{ type: 'other', link: parent }] : [],
        label: label || parent?.__debug?.fragment || '',
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
    anchor.__easyhard.parent.push({ type: 'other', link: parent })
  }
}

export function debugFragmentChild(element: DomElement & (null | ElementDebugMeta), parent: DomElement) {
  if (debugWindow.__easyhardDebug) {
    if (element === null) return
    if (!element.__easyhard) debugElement(element)
    if (!element.__easyhard) throw new Error('element should have __debug propery')
    element.__easyhard.parent.push({ type: 'other', link: parent })
    element.__easyhard.indirect = true
  }
}

export function debugOperator<T, K, R extends OperatorFunction<T, K> | Observable<T>>(operator: R, name: string, parent: (Node | Observable<any>)[]): R {
  if (debugWindow.__easyhardDebug) {
    Object.defineProperty(operator, '__debug', {
      value: {
        id: getUID(),
        name,
        parent: parent.map(link => ({ type: 'other', link })),
        nextBuffer: new ReplaySubject(),
        subscribe: new ReplaySubject(),
        unsubscribe: new ReplaySubject()
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
