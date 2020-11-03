/* eslint-disable @typescript-eslint/no-use-before-define */
import { Observable, Subject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import { DomElement, Attrs, Child, PropAttrs, TagName, EventAttrs, EventHandler, EventName } from './types'
import { insertNode, createAnchor } from './utils'
import { untilExist } from './operators/until-exist'

type NestedChild = Child | NestedChild[];

export function createElement<K extends TagName>(tag: K, attrs: Attrs<K>, ...children: NestedChild[]): HTMLElement {
  const element = document.createElement(tag)

  for (const name in attrs) {
    if (name && attrs.hasOwnProperty(name)) {
      if (`on${name}` in element) {
        const attrName = name as EventName
        const attr = attrs[attrName] as EventHandler<keyof EventAttrs>

        if (attr instanceof Subject) {
          element.addEventListener(attrName, ((e: HTMLElementEventMap[EventName]) => attr.next(e)) as EventListener)
        } else if (attr) {
          const subject = new Subject<HTMLElementEventMap[EventName]>()

          subject.pipe(untilExist(element), attr).subscribe()
          element.addEventListener(attrName, ((e: HTMLElementEventMap[EventName]) => subject.next(e)) as EventListener)
        }
      } else {
        const attrName = name as keyof PropAttrs<K>
        const attr = attrs[attrName]

        if (attr === true) {
          element[attrName] = true as unknown as HTMLElementTagNameMap[K][typeof attrName]
        } else if (attr instanceof Observable) {
          attr.pipe(untilExist(element)).subscribe(value => {
            element[attrName] = value as unknown as HTMLElementTagNameMap[K][typeof attrName]
          })
        } else if (attr !== false && attr != null) {
          element[attrName] = attr as unknown as HTMLElementTagNameMap[K][typeof attrName]
        }
      }
    }
  }

  for (const child of children.flat(Infinity) as Child[]) {
    appendChild(child, element)
  }

  return element
}

export function appendChild(child: Child, parent: ChildNode, after: DomElement = null): DomElement {
  const el = resolveChild(child)
  if (el) {
    insertNode(el, parent, after)
  }
  return el
}

function resolveChild(child: Child): DomElement {
  if (child instanceof Observable) {
    const anchor = createAnchor()

    child.pipe(untilExist(anchor), distinctUntilChanged()).subscribe(v => {
      anchor.edge && anchor.edge.remove()
      anchor.textContent = ''

      if (v instanceof Comment || v instanceof HTMLElement || v instanceof Text) {
        anchor.edge = v
        insertNode(anchor.edge, anchor.parentNode as Node, anchor)
      } else {
        anchor.textContent = v as string
      }
    }, null, () => anchor.edge && anchor.edge.remove())

    return anchor
  }

  if (typeof child !== 'object') {
    return document.createTextNode(String(child))
  }

  return child
}
