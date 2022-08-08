/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common'
import { Observable, Subscriber, Subscription } from 'rxjs'
import { DomElement } from './types'

type ObservableDebugMeta = { __debug?: { fragment?: string } }
type SubscriberDebugMeta = { destination?: SubscriberDebugMeta, __debug?: { id?: string, sources: { snapshot: () => SubscriberDebugMeta[] }, observable: ObservableDebugMeta } }
type Parent = { type: 'argument' | 'other', link: Subscription | DomElement } | Parent[]
type ElementDebugMeta = { __easyhard?: { id: string, attrs: Record<string, Subscription>, parent: Parent[], indirect?: boolean } }
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

export function debugElementAttr(element: (Comment | HTMLElement | Text) & ElementDebugMeta, name: string, sub: (Subscription & SubscriberDebugMeta)) {
  if (debugWindow.__easyhardDebug) {
    if (!element.__easyhard) throw new Error('element should have __debug property')
    if (sub && 'destination' in sub && sub.destination && '__debug' in sub.destination && sub.destination && sub.destination.__debug) {
      sub.destination.__debug.id = element.__easyhard.id
    }
    element.__easyhard.attrs[name] = sub
  }
}

export function debugFragment(anchor: DomElement, label: string, parent?: Subscription & SubscriberDebugMeta) {
  if (debugWindow.__easyhardDebug) {
    const id = getUID()

    if (parent) {
      if (!parent.destination) throw new Error('should have destination')
      ;(parent.destination as any).__debug.id = id
    }
    const fragment = parent?.__debug?.observable?.__debug?.fragment || parent?.__debug?.sources.snapshot()[0]?.__debug?.observable?.__debug?.fragment // TODO dont bypass source (untilExist)

    Object.defineProperty(anchor, '__easyhard', {
      value: <FragmentDebugMeta['__easyhard']>{
        id,
        parent: parent ? [{ type: 'other', link: parent }] : [],
        label: label || fragment || '',
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
export function debugFragmentAddParent(anchor: DomElement & FragmentDebugMeta, parent: (Subscription & SubscriberDebugMeta) | DomElement) { // TODO
  if (debugWindow.__easyhardDebug) {
    if (!anchor.__easyhard) throw new Error('anchor should have __debug propery')
    if (parent && 'destination' in parent && parent.destination && '__debug' in parent.destination && parent.destination && parent.destination.__debug) {
      parent.destination.__debug.id = anchor.__easyhard.id
    }
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

export function debugObservableName(ob: Observable<any>, name: string) {
  if (debugWindow.__easyhardDebug) {
    (ob as any).__debug.name = name
  }
  return ob
}

export function debugObservableInternal(ob: Observable<any>) {
  if (debugWindow.__easyhardDebug) {
    (ob as any).__debug.internal = true
  }
  return ob
}

export function debugBindSubscribers(source: (Subscription | Subscriber<any>) & { destination?: any }, next: Subscriber<any> & { __debug?: any }) {
  if (debugWindow.__easyhardDebug) {
    source.destination = next
    next.__debug.sources.next({ add: source })
  }
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
