import { Observable, Subject } from 'rxjs'
import { DomElement, Attrs, Child, PropAttrs, TagName, EventAttrs, EventHandler, EventName, ElementType, NestedChild } from './types'
import { insertNode, createAnchor } from './utils'
import { untilExist } from './operators/until-exist'
import { debugFragment, debugElement, debugFragmentChild } from './devtools'

export function createElement<K extends TagName>(tag: K, attrs: Attrs<K>, ...children: NestedChild[]): ElementType<K> {
  const element = document.createElement(tag)

  debugElement(element, attrs)

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

    debugFragment(anchor, '', child)

    child.pipe(untilExist(anchor)).subscribe(v => {
      if (typeof v !== 'object' && anchor.edge instanceof Text) { // performance optimization
        anchor.edge.textContent = v as string
        return
      }
      anchor.edge && anchor.edge.remove()

      if (v instanceof Comment || v instanceof HTMLElement || v instanceof Text) {
        anchor.edge = v
      } else if (v instanceof Observable) {
        const element = resolveChild(v)

        anchor.edge = element
      } else {
        const element = debugElement(document.createTextNode(''), {})

        element.textContent = v as string
        anchor.edge = element
      }

      debugFragmentChild(anchor.edge, anchor)

      if (anchor.edge) {
        insertNode(anchor.edge, anchor.parentNode as Node, anchor)
      }
    }, null, () => {
      anchor.edge && anchor.edge.remove()
      anchor.remove()
    })

    return anchor
  }

  if (typeof child !== 'object') {
    return document.createTextNode(String(child))
  }

  return child
}
