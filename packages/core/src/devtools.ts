import { getUID } from 'easyhard-common'
import { Observable } from 'rxjs'
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
